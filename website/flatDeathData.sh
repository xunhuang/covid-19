cat src/data/AllData.json | jq -S -f FlattenDeath.jq | jq -r '(map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' 
