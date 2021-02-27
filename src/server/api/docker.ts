import { FastifyInstance, FastifyRegisterOptions, FastifyReply, FastifyRequest, HTTPMethods } from "fastify";
import { execAsync, execSync } from "@solid-js/cli";

// -----------------------------------------------------------------------------

let dockerExecPath = 'docker';

export default function ( fastify:FastifyInstance, options:FastifyRegisterOptions<any>, done )
{
	// Get docker executable path
	dockerExecPath = execSync(`which docker`).trim() || '/usr/local/bin/docker';
	console.log(`Docker exec path: ${dockerExecPath}`);

	// Register routes on get and post
	const method:HTTPMethods[] = ['GET', 'POST'];
	fastify.route({ method, url: '/list', handler: list })
	fastify.route({ method, url: '/start', handler: start })
	fastify.route({ method, url: '/stop', handler: stop })
	fastify.route({ method, url: '/remove', handler: remove })
	done();
}

// -----------------------------------------------------------------------------

async function list ( request:FastifyRequest, reply:FastifyReply )
{
	const result = await execAsync(`${dockerExecPath} stats -a --no-trunc --no-stream`)
	// TODO : Parse
	// TODO : Remove delay
	reply.send( result )
}

async function start ( request:FastifyRequest, reply:FastifyReply )
{

}

async function stop ( request:FastifyRequest, reply:FastifyReply )
{
}

async function remove ( request:FastifyRequest, reply:FastifyReply )
{
}

