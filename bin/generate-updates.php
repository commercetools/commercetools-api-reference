#!/usr/bin/env php
<?php

namespace Commercetools;

use GuzzleHttp\Psr7\Uri;
use Symfony\Component\Yaml\Yaml;

function pascalcase($scored)
{
    return ucfirst(
        implode(
            '',
            array_map(
                'ucfirst',
                array_map(
                    'strtolower',
                    explode('-', $scored)
                )
            )
        )
    );
}

function camel2dashed($scored) {
    return strtolower(preg_replace('/([a-zA-Z])(?=[A-Z])/', '$1-', $scored));
}

class Field
{
    /**
     * @var string
     */
    public $name;
    /**
     * @var string
     */
    public $jsonName;
    /**
     * @var bool
     */
    public $required;

    /**
     * @var string
     */
    public $type;

    public $format;

    /**
     * Field constructor.
     * @param string $name
     * @param bool $required
     * @param string $type
     * @param string $format
     * @param string $jsonName
     */
    public function __construct($name, $required, $type, $format = null, $jsonName = null)
    {
        $this->name = $name;
        $this->required = $required;
        $this->type = $type;
        $this->format = $format;
        $this->jsonName = !is_null($jsonName) ? $jsonName : $name;
    }
}

class UpdateAction
{
    /**
     * @var string
     */
    public $domain;
    /**
     * @var
     */
    public $action;
    /**
     * @var string
     */
    public $docsUri;
    /**
     * @var string
     */
    public $displayName;

    /**
     * @var Field[]
     */
    public $fields;

    /**
     * UpdateAction constructor.
     * @param $value
     * @param Field[] $fields
     * @param $docsAnchor
     */
    /**
     * UpdateAction constructor.
     * @param string $domain
     * @param string $action
     * @param Field[] $fields
     * @param string $docsUri
     */
    public function __construct($domain, $action, array $fields, $docsUri)
    {
        $this->action = $action;
        $this->fields = $fields;
        $this->domain = $domain;
        $this->displayName = ucfirst($domain) . ucfirst($action) . 'Action';
        $this->docsUri = $docsUri;
    }
}

class RamlModelParser
{
    const RAML_MODEL_PATH = __DIR__ . '/../types/';

    private $ramlTypes = [];


    private function getRamlTypes() {
        if (empty($this->ramlTypes)) {
            $ramlTypesFile = static::RAML_MODEL_PATH . 'types.raml';
            if (!file_exists($ramlTypesFile)) {
                return [];
            }

            $types = Yaml::parse(file_get_contents($ramlTypesFile));

            $ramlTypes = [];
            foreach ($types as $typeName => $typeFile) {
                $ramlFile = trim(str_replace('!include', '', $typeFile));
                $ramlType = Yaml::parse(file_get_contents(static::RAML_MODEL_PATH . $ramlFile));

                if (isset($ramlType['properties']) || isset($ramlType['type'])) {
                    $ramlTypes[$typeName] = $ramlType;
                }
            }

            $ramlInfos = [];
            foreach ($ramlTypes as $typeName => $ramlType) {
                $ramlFile = trim(str_replace('!include', '', $types[$typeName]));
                $package = pascalcase(dirname($ramlFile));
                $docsUri = '';
                if (isset($ramlType['(docs-uri)'])) {
                    $docsUri = (new Uri($ramlType['(docs-uri)']))->withFragment('')->__toString();
                }
                $updates = [];
                if (isset($ramlType['(hasUpdateActions)'])) {
                    $updates = $ramlType['(hasUpdateActions)'];
                }
                $fields = $this->resolveProperties($ramlTypes, $ramlType);
                if (count($fields) > 0) {
                    $ramlInfos[$typeName] = [
                        'fields' => $fields,
                        'domain' => $package,
                        'model' => $typeName,
                        'docsUri' => $docsUri,
                        'updates' => $updates,
                    ];
                }
            }
            $this->ramlTypes = $ramlInfos;
        }

        return $this->ramlTypes;
    }

    private function resolveProperties($ramlTypes, $ramlType)
    {
        if (isset($ramlType['type'])) {
            $parentType = isset($ramlTypes[$ramlType['type']]) ? $ramlTypes[$ramlType['type']] : [];
            $parentProperties = $this->resolveProperties($ramlTypes, $parentType);
        } else {
            $parentProperties = [];
        }
        if (isset($ramlType['properties'])) {
            $properties = array_map(
                [$this, 'parseProperty'],
                array_keys($ramlType['properties']),
                $ramlType['properties']
            );
        } else {
            $properties = [];
        }
        return array_merge($parentProperties, $properties);
    }

    private function parseProperty($key, $property)
    {
        $name = str_replace('?', '', $key);
        if (!is_array($property)) {
            $property = ['type' => $property];
        }
        $property['name'] = $name;
        $optional = strpos($key, '?') > 0;
        $property['required'] = isset($property['required']) ? ($property['required'] == true) : !$optional;
        return $property;
    }

    private function getUpdateCommand(UpdateAction $action)
    {
        $domainName = ucfirst($action->domain);
        $exampleFileName = 'examples/' . $action->domain . '/' . $action->displayName . '.json';
        $docsUri = '(docs-uri): ' . $action->docsUri;
        if (strlen($docsUri) > 120) {
            $docsUri = '# yamllint disable-line rule:line-length' . PHP_EOL . $docsUri;
        }
        $exampleExists = file_exists(__DIR__ . '/../' . $exampleFileName) ? '(postman-example): !include ../../../' . $exampleFileName : '';
        $command = <<<EOF
#%RAML 1.0 DataType
# This file is auto-generated. Do not touch!
(package): $domainName
{$docsUri}

type: {$domainName}UpdateAction
displayName: {$action->displayName}
discriminatorValue: {$action->action}
$exampleExists
properties:

EOF;
        foreach ($action->fields as $field) {
            $required = $field->required ? '' : '?';
            $format = $field->format ? '    format: ' . $field->format . PHP_EOL : '';
            $command .= <<<EOF
  {$field->name}{$required}:
    type: {$field->type}
$format
EOF;
        }

        return $command;
    }

    /**
     * @param $types
     * @return UpdateAction[]
     */
    private function getUpdateActions($types)
    {
        $actions = [];
        foreach ($types as $type) {
            $actions = array_merge(
                $actions,
                $this->getSimpleActions($type),
                $this->getFieldActions($type),
                $this->getComplexActions($type),
                $this->getCustomActions($type)
            );
        }

        return $actions;
    }

    /**
     * @param $type
     * @return UpdateAction[]
     */
    private function getSimpleActions($type)
    {
        $simpleActionFields = array_filter($type['fields'], function ($field) {
            return strpos($field['name'], '/') === false && isset($field['(hasSimpleUpdateAction)']);
        });
        return array_map(
            function ($field) use ($type){
                $docsUri = $type['docsUri'] . '#' . camel2dashed($field['(hasSimpleUpdateAction)']);
                $fields = [
                    new Field($field['name'], $field['required'], $field['type'], $field['format'] ?? null)
                ];
                return new UpdateAction($type['domain'], $field['(hasSimpleUpdateAction)'], $fields, $docsUri);
            },
            $simpleActionFields
        );
    }

    /**
     * @param $type
     * @return UpdateAction[]
     */
    private function getFieldActions($type)
    {
        $actionFields = array_filter($type['fields'], function ($field) {
            return strpos($field['name'], '/') === false && isset($field['(hasUpdateAction)']);
        });
        return array_map(
            function ($field) use ($type){
                $actionInfo = $this->enrich($field, $field['(hasUpdateAction)']);
                return $this->getUpdateAction($type, $actionInfo);
            },
            $actionFields
        );
    }

    private function enrich($field, $actionInfo)
    {
        if (!isset($actionInfo['fields'])) {
            $required = isset($actionInfo['required']) ? ($actionInfo['required'] == true) : $field['required'];
            $actionInfo['fields'] = [
                $field['name'] => ['name' => $field['name'], 'required' => $required, 'type' => $field['type'], 'format' => $field['format'] ?? null]
            ];
        }
        return $actionInfo;
    }

    /**
     * @param $type
     * @return UpdateAction[]
     */
    private function getComplexActions($type)
    {
        $actionFields = array_filter($type['fields'], function ($field) {
            return strpos($field['name'], '/') === false && isset($field['(hasUpdateActions)']);
        });

        $actions = [];
        foreach ($actionFields as $field) {
            foreach ($field['(hasUpdateActions)'] as $actionInfo) {
                $actionInfo = $this->enrich($field, $actionInfo);
                $actions[] = $this->getUpdateAction($type, $actionInfo);
            }
        }
        return $actions;
    }

    /**
     * @param $type
     * @return UpdateAction[]
     */
    private function getCustomActions($type)
    {
        $actions = [];
        foreach ($type['updates'] as $actionInfo) {
            $actions[] = $this->getUpdateAction($type, $actionInfo);
        }
        return $actions;
    }

    private function getUpdateAction($type, $actionInfo)
    {
        $docsUri = $type['docsUri'] . '#' . (isset($actionInfo['docsAnchor']) ? $actionInfo['docsAnchor'] : camel2dashed($actionInfo['action']));
        $fields = [];
        foreach ($actionInfo['fields'] as $actionFieldName => $actionField) {
            $property = $this->parseProperty($actionFieldName, $actionField);
            $fields[] = new Field($property['name'], $property['required'], $property['type'], $property['format'] ?? null);
        }
        return new UpdateAction($type['domain'], $actionInfo['action'], $fields, $docsUri);
    }

    public function generateUpdateCommands()
    {
        $types = $this->getRamlTypes();
        /**
         * @var UpdateAction[] $actions
         */
        $actions = $this->getUpdateActions($types);

        foreach ($actions as $action) {
            $output = $this->getUpdateCommand($action);
            $outputFileName = __DIR__ . '/../types/' . camel2dashed($action->domain) . '/updates/' . $action->displayName . '.raml';
            $this->ensureDirectory($outputFileName);
            file_put_contents($outputFileName, $output);
        }
    }

    private function ensureDirectory($fileName)
    {
        $dirName = dirname($fileName);
        if (!file_exists($dirName)) {
            mkdir($dirName, 0777, true);
        }
    }
}

require __DIR__ . '/../vendor/autoload.php';

(new RamlModelParser())->generateUpdateCommands();
