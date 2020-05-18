document.addEventListener('DOMContentLoaded', () => {

	document.querySelector('#submit').disabled = true;
	
	document.querySelector('#username').onkeyup = () => {
                    if (document.querySelector('#username').value.length > 0)
                        document.querySelector('#submit').disabled = false;
                    else
                        document.querySelector('#submit').disabled = true;
                };

});