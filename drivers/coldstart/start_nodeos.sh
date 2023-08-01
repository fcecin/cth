nodeos --config-dir ./ --data-dir ./data --genesis-json ./genesis.json  >> "./chain.log" 2>&1 & echo $! > "./nodeos.pid"
