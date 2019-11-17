const path = require('path');
const copyWebpackPlugin = require("copy-webpack-plugin");  

var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
	mode: 'development',
	externals: nodeModules,
	target: 'node',
	entry: {
		index: './permawebifying_ipfs.js'
	},
	output :{
		path: path.resolve(__dirname, 'dist'),
		filename: 'permawebifying_ipfs.js'
	},
	resolve: {
		modules: [
		  "./", 
		  "./node_modules"
		],
		extensions : ['.js', '.jsx', '.json']
	  },
	  resolveLoader: {
		modules: ['node_modules']
	},
	module: {
        rules: [
            {
				exclude: path.resolve(__dirname, 'node_modules'), 
			},
        ]
	},
	plugins: [
        new copyWebpackPlugin([
		    {
                from: path.join(__dirname, "./arweave-keyfile-xpm-wo9_bvhvIKUwhhKNnvW3WTrb63ed5GL41Okd17A.json"),
                to: path.join(__dirname, "./dist/arweave-keyfile-xpm-wo9_bvhvIKUwhhKNnvW3WTrb63ed5GL41Okd17A.json"),
			},
			{
                from: path.join(__dirname, "./permawebifying_ipfsd"),
                to: path.join(__dirname, "./dist"),
		    }
	    ])
	]
}