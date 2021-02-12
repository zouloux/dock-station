#!/usr/bin/env node
const { CLICommands, newLine, execAsync, printLoaderLine } = require("@solid-js/cli");
const { delay } = require("@solid-js/core");
const path = require('path');
const { File, Directory, FileFinder } = require("@solid-js/files");
const { SolidParcel, SolidNodeServerPlugin, SolidMiddlewarePlugin, SolidTypeCheckerPlugin } = require("@solid-js/bundler");

// --—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—-- MAIN FRONT APP

SolidParcel.app('app', {
	input: 'src/app/index.tsx',
	output: 'dist/volumes/core-dock-station/public/',
	publicUrl: '',
	plugins: [
		SolidMiddlewarePlugin.init({
			async beforeBuild ( buildMode, appOptions, envProps, buildEvent, buildError ) {
				// Only first build
				if ( buildEvent ) return;
				const staticLoader = printLoaderLine(`Copying static files`)
				const indexFile = new File('src/app/index.html')
				indexFile.template({...envProps})
				await indexFile.save(path.join(appOptions.output, 'index.html'))
				staticLoader(`Copied static files`)
			}
		})
	]
})
// --—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—-- NODE SERVER

SolidParcel.app('server', {
	input: 'src/server/server.ts',
	appType: 'node',
	output: 'dist/volumes/core-dock-station/server/',
	hardWatch: true,
	plugins: [
		// Watch, rebuild and reload server automatically
		SolidNodeServerPlugin.init({
			name: 'DevNodeServer'
		})
	]
})

// --—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—-- CLEAN COMMANDS

// Clear parcel and solid cache
CLICommands.add(['clear-cache', 'clearcache'], async ( args, options ) => {
	const clearLoader = printLoaderLine(`Clearing cache ...`);
	const clearedPaths = await SolidParcel.clearCache( options.app );
	clearLoader(`${clearedPaths.length} cache${clearedPaths.length > 1 ? 's' : ''} cleared`, '🧹');
}, {
	app: null
});

// Clean dist directory before each build
CLICommands.add(['clean', 'dev', 'build'], async ( args, options, commandName ) => {
	const cleanLoader = printLoaderLine(`Cleaning outputs ...`);
	const clearedPaths = await SolidParcel.clean( options.app, commandName !== 'clean' );
	cleanLoader(`Cleaned ${clearedPaths.length} director${clearedPaths.length > 1 ? 'ies' : 'y'}`, '🧹')
}, {
	app: null
})

// --—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—-- BUILD COMMANDS

CLICommands.add('dev', async ( args, options ) => {

	const envName = ''+options.env;
	await SolidParcel.dev('app', envName);
	await SolidParcel.dev('server', envName, [
		// Disable dev server if we are in docker mode
		options.docker && 'DevNodeServer'
	]);

	// Run docker with correct envName
	options.docker && execAsync(`envName=${ envName ? '.'+envName : '' } docker-compose up`, 3).then( () => {} );

}, {
	env: '',
	docker: false
});

CLICommands.add('build', async ( args, options ) => {

	await SolidParcel.build('app', options.env.toString());
	await SolidParcel.build('server', options.env.toString());

}, {
	env: ''
});

// --—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—--—-- START & DEFAULT COMMAND

CLICommands.start();