import { fastify, FastifyReply, FastifyRequest } from "fastify"
import fastifyStatic from "fastify-static";
import * as path from "path"
import { onProcessKilled } from "@solid-js/cli";
const crypto = require('crypto');


// ----------------------------------------------------------------------------- CONFIG

// Secure access login and passwords.
const secureSalts = ['iL0v3', '$aL7']
const secureAccess  = {
	// Login : Hashed Password
	'admin' : '8d06d5ad959b3144f63a155d4bc610cfe0253d77dc0975b8e47a2055a1ff998b', // admin : admin

	// To know your password hash, start server open URL in a browser.
	// A http auth prompt should open and ask for login / password.
	// Enter "please-hash-it" as a login, and type your password.
	// Your hashed password will be shown in Node's console.
	// Important : If secure salts are changed, all passwords must be regenerated
};

// ----------------------------------------------------------------------------- SERVER INIT

// Init server instance
const server = fastify();

// Init static folders
server.register(fastifyStatic, {
	root: path.join(__dirname,'../', 'public'),
	prefix: '/',
	list: false
});

// ----------------------------------------------------------------------------- SECURITY & AUTHENTICATION

// Hash and salt a password
function hashPassword (password) {
	const saltedPassword = secureSalts[0] + password + secureSalts[1];
	return crypto.createHmac('sha256', saltedPassword).digest('hex');
}

// Register authentication service
server.register(
	require('fastify-basic-auth'), {
		authenticate : { realm: 'Dock Station'},
		validate: async ( requestedLogin:string, requestedPassword:string, request:FastifyRequest, reply:FastifyReply ) => {

			// Check if requested user and password match any authorized user
			const requestedHashedPassword = hashPassword( requestedPassword );

			// Show hashed password in console
			if ( requestedLogin === 'please-hash-it' )
				console.log( requestedHashedPassword );

			let haveAccess = false;
			for ( const storedLogin in secureAccess )
				if ( secureAccess[ storedLogin ] == requestedHashedPassword ) {
					haveAccess = true;
					break;
				}

			// User do not have correct access
			if ( !haveAccess )
				return new Error('Wrong password');
		}
	}
)

// Enabled password on all pages
server.after( () => server.addHook( 'onRequest', server['basicAuth'] ) );

// ----------------------------------------------------------------------------- ERRORS

// Show an error
// TODO : Show html / json and error depending on context ...
export const fireError = ( code, reply, message, errorObject? ) => {
	console.error( code, message )
	errorObject && console.error( errorObject )
	reply.code( code ).send({
		error: code,
		message
	})
}

// Not found
server.setNotFoundHandler( (request, reply) => {
	if ( request.url === '/favicon.ico' ) return;
	fireError(404, reply, '404 - ' + request.url );
})

// Any errors
server.setErrorHandler( ( error, request, reply ) => {
	if ( error.statusCode === 401 )
		return fireError( 401, reply, 'Not allowed - ' + error?.message ?? '' );
	reply.send( error )
})

// ----------------------------------------------------------------------------- APIs

require('./server-api').init( server );

// ----------------------------------------------------------------------------- START SERVER

let serverIsRunning = false;

// Run the server
server.listen( process.env.DOCK_STATION_SERVER_INTERNAL_PORT, '0.0.0.0', async (err, address) => {
	if ( err ) throw err
	console.log(`Server listening on ${address}`);
	serverIsRunning = true;
});

// Listen exits
onProcessKilled( async (signal:string, error?) => {

	console.log(`Received closing signal ${signal} ...`);
	error && console.error(error);

	if (serverIsRunning) {
		console.log('Closing server ...');
		await server.close();
		serverIsRunning = false;
		console.log('Closed');
	}

	// Exit with correct code
	process.exit( signal == 'uncaughtException' ? 2 : 0 );
})