# permawebifying_ipfs_service

This project provide a web service endpoint to accept IPFS file hash request, fetching the file from IPFS network and store it to Arweave chain. Default endpoint is  http://127.0.1:1080/

You can use <code>curl -d 'QmXgZAUWd8yo4tvjBETqzUy3wLx5YRzuDwUQnBwRGrAmA9' -X POST http://127.0.1:1080/ </code>to test it.

You can also use https://github.com/zyfrank/permawebifying_ipfs_front to use this service.

arweave-keyfile-xpm-wo9_bvhvIKUwhhKNnvW3WTrb63ed5GL41Okd17A.json is wallet provided by Arweave team. If you have many IPFS files to store to Arweave chain, you should use a wallet which have enough AR.
