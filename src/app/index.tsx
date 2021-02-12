import { h, render } from "preact";
import { useState } from "preact/hooks";




function App ()
{
	const [ counter, setCounter ] = useState(0);

	return <div onClick={ () => setCounter( counter + 1) }> OKK { counter }</div>
}



render( <App />, document.getElementById('AppContainer') );