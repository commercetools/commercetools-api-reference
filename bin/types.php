<?php
namespace Commercetools;

$baseDir = dirname(__DIR__);
$typeDir = 'types';

$allFiles = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($baseDir . '/' . $typeDir));
$ramlFiles = new \RegexIterator($allFiles, '/\.raml$/');

$types = [];

function camelize($scored)
{
    return implode(
            '',
            array_map(
                'ucfirst',
                array_map(
                    'strtolower',
                    explode('-', $scored)
                )
            )
    );
}

foreach ($ramlFiles as $ramlFile) {
    $typeFile = $ramlFile->getRealPath();
    $content = file($typeFile);
    if (strpos(current($content), "#%RAML 1.0 DataType") !== 0) {
        continue;
    }
    $displayName = '';
    foreach ($content as $line) {
        $isDisplayName = strpos($line, 'displayName:');
        if ($isDisplayName !== false && $isDisplayName >= 0) {
            $displayName = trim(str_replace('displayName:', '', $line));
            break;
        }
    }
    $shortTypeFileName = str_replace($baseDir . '/', '', $typeFile);
    if ($displayName == '') {
        $displayName = camelize(basename($shortTypeFileName, '.raml'));
    }
    $newFileName = dirname($shortTypeFileName) . '/' . $displayName . '.raml';
    $data = [
        'displayName' => $displayName,
        'originalName' => $shortTypeFileName,
        'fileName' => $newFileName
    ];

    $types[$displayName] = $data;
}

$newTypes = [];

foreach ($types as $type) {
    if ($type['originalName'] !== $type['fileName']) {
        exec('git mv ' . $type['originalName'] . ' ' . $type['fileName']);
    }
    $newTypes[] = $type['displayName'] . ': !include ' . str_replace($typeDir . '/' , '', $type['fileName']);
}

//echo implode(PHP_EOL, $newTypes) . PHP_EOL;

file_put_contents($baseDir . '/' . $typeDir . '/types.raml', implode(PHP_EOL, $newTypes) . PHP_EOL);

echo PHP_EOL;
