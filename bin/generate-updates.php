#!/usr/bin/env php
<?php

namespace Commercetools;

use GuzzleHttp\Psr7\Uri;
use Symfony\Component\Yaml\Yaml;

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
                $package = $this->pascalcase(dirname($ramlFile));
                $docsUri = '';
                if (isset($ramlType['(docs-uri)'])) {
                    $docsUri = (new Uri($ramlType['(docs-uri)']))->withFragment('')->__toString();
                }
                $fields = $this->resolveProperties($ramlTypes, $ramlType);
                $fields = array_filter(
                    $fields,
                    function ($field) {
                        return strpos($field['name'], '/') === false && $field['hasUpdateAction'] === true;
                    }
                );
                if (count($fields) > 0) {
                    $ramlInfos[$typeName] = [
                        'fields' => $fields,
                        'domain' => $package,
                        'model' => $typeName,
                        'docsUri' => $docsUri
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
                function ($key, $property) {
                    $name = str_replace('?', '', $key);
                    return [
                        'name' => $name,
                        'key' => $key,
                        'type' => isset($property['type']) ? $property['type'] : $property,
                        'optional' => strpos($key, '?') > 0,
                        'discriminatorValue' => isset($property['(hasUpdateAction)']) ? $property['(hasUpdateAction)'] : '',
                        'hasUpdateAction' => isset($property['(hasUpdateAction)']) ? true : false,
                        'docsActionAnchor' => isset($property['(docsActionAnchor)']) ? $property['(docsActionAnchor)'] : null,
                    ];
                },
                array_keys($ramlType['properties']),
                $ramlType['properties']
            );
        } else {
            $properties = [];
        }
        return array_merge($parentProperties, $properties);
    }

    protected function pascalcase($scored)
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

    protected function camel2dashed($scored) {
        return strtolower(preg_replace('/([a-zA-Z])(?=[A-Z])/', '$1-', $scored));
    }

    private function getUpdateCommand($domain, $field, $docsUri)
    {
        $domainName = ucfirst($domain);
        $displayName = $this->getDisplayName($domain, $field);
        $exampleFileName = 'examples/' . $domain . '/' . $displayName . '.json';
        $exampleExists = file_exists(__DIR__ . '/../' . $exampleFileName) ? '(postman-example): !include ../../../' . $exampleFileName : '';
        $docsUri = $docsUri . '#' . (isset($field['docsActionAnchor']) ? $field['docsActionAnchor'] : $this->camel2dashed($field['discriminatorValue']));

        return <<<EOF
#%RAML 1.0 DataType
# This file is auto-generated. Do not touch!
(package): $domainName
(docs-uri): $docsUri

type: {$domainName}UpdateAction
displayName: $displayName
discriminatorValue: {$field['discriminatorValue']}
$exampleExists
properties:
    {$field['key']}:
        type: {$field['type']}

EOF;
    }

    private function getDisplayName($domain, $field)
    {
        $domainName = ucfirst($domain);
        return $domainName . ucfirst($field['discriminatorValue']) . 'Action';
    }

    public function generateUpdateCommands()
    {
        $types = $this->getRamlTypes();

        foreach ($types as $type) {
            foreach ($type['fields'] as $field) {
                $output = $this->getUpdateCommand($type['domain'], $field, $type['docsUri']);
                $outputFileName = __DIR__ . '/../types/' . $this->camel2dashed($type['domain']) . '/updates/' . $this->getDisplayName($type['domain'], $field) . '.raml';
                $this->ensureDirectory($outputFileName);
                file_put_contents($outputFileName, $output);
            }
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
