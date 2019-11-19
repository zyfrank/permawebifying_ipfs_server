const http = require('http')
const fs = require('fs')
const Arweave = require('arweave/node')
const { equals } = require('arql-ops')
const argv = require('yargs').argv
const IPFS = require('ipfs')
const pTimeout = require('p-timeout');

// Set Arweave parameters from commandline or defaults.
const arweave_port = argv.arweavePort ? argv.arweavePort : 443
const arweave_host = argv.arweaveHost ? argv.arweaveHost : 'arweave.net'
const arweave_protocol = argv.arweaveProtocol ? argv.arweaveProtocol : 'https'

const port = argv.port ? argv.port : 1080

if (!argv.walletFile) {
    console.log("ERROR: Please specify a wallet file to load using argument " +
        "'--wallet-file <PATH>'.")
    process.exit()
}

const raw_wallet = fs.readFileSync(argv.walletFile);
const wallet = JSON.parse(raw_wallet);
let node;

const arweave = Arweave.init({
    host: arweave_host, // Hostname or IP address for a Arweave node
    port: arweave_port,
    protocol: arweave_protocol
})

async function handleRequest(request, response) {
    // Enable CORS
    response.setHeader(
        'Access-Control-Allow-Origin', '*'
    )
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    var hash = ''
    request.on('data', function (data) {
        hash += data
    })

    request.on('end', async function () {
        console.log("hash is :" + hash)

        // check if some arweave transactions already contain this IPFS hash
        const query = equals('IPFS-Add', hash)
        const txIds = await arweave.arql(query)
        if (txIds != undefined && txIds != null && txIds.length > 0) {
            console.log(`Transaction(s) ${txIds} already contain IPFS {hash}`)
            const output = { 'existedTxIds': txIds }
            response.end(JSON.stringify(output) + "\n")
        } else{
            let fileBuffer
            let error = false
            try {
                const p = node.cat(hash).then(r => {
                    fileBuffer = r
                    console.log("fileBuffer length:" + fileBuffer.length)
                }).catch(e => {
                    console.log(e.toString())
                    const output = { 'error': e.toString() }
                    response.end(JSON.stringify(output) + "\n")
                    error = true
                })
                await pTimeout(p, 10000);
            } catch (e) {
                console.log("IPFS cat timeout")
                const output = { 'error': "Error: Get IPFS file timeout" }
                response.end(JSON.stringify(output) + "\n")
                error = true
            }
            if (error) {
                return
            }

            let tx = await arweave.createTransaction({ data: fileBuffer }, wallet)
            tx.addTag("IPFS-Add", hash)

            dispatchTX(tx, response)
        }

    })

}

async function dispatchTX(tx, response) {
    // Manually set the transaction anchor, for now.
    const anchor_id = await arweave.api.get('/tx_anchor').then(x => x.data)
    tx.last_tx = anchor_id

    // Sign and dispatch the TX, forwarding the response code as our own.
    await arweave.transactions.sign(tx, wallet)
    let resp = await arweave.transactions.post(tx);
    response.statusCode = resp.status
    let output = { 'newId': tx.get('id') }
    console.log(`Transaction ${tx.get('id')} dispatched to ` +
        `${arweave_host}:${arweave_port} with response: ${resp.status}.`)
    console.log(output)
    response.end(JSON.stringify(output) + "\n")
}

module.exports = async function startServer() {

    // Print introductory information to the console.
    console.log(`...starting service at http://localhost:${port}.`)

    const address = await arweave.wallets.jwkToAddress(wallet)
    let balance = arweave.ar.winstonToAr(await arweave.wallets.getBalance(address))
    console.log(`...using wallet ${address} (balance: ${balance} AR).`)

    let net_info = await arweave.network.getInfo()
    console.log("...dispatching transactions to Arweave host at",
        `${arweave_host}:${arweave_port},`,
        `synchronised at block ${net_info.height}.`)

    // Start the service itself.
    const server = http.createServer(handleRequest)
    server.listen(port, (err) => {
        if (err) {
            return console.log('Server experienced error:', err)
        }
    })
    node = await IPFS.create();

}

