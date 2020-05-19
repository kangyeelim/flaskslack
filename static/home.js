localStorage.removeItem('last_channel');
if (localStorage.getItem('last_channel')) {
            // Redirect to last channel
            let channel = localStorage.getItem('last_channel');    
            window.location.replace('/channels/' + channel);   
        }
		
document.addEventListener('DOMContentLoaded', () => {
	localStorage.removeItem('last_channel');
	document.querySelector('#submit').disabled = true;
	
	document.querySelector('#channel').onkeyup = () => {
                    if (document.querySelector('#channel').value.length > 0)
                        document.querySelector('#submit').disabled = false;
                    else
                        document.querySelector('#submit').disabled = true;
                };

});