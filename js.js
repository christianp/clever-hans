var parser = PEG.buildParser(document.getElementById('grammar').innerText);

function error(name,hide) {
	var e = document.getElementById(name);
	if(hide) {
		e.classList.remove('show');
	} else {
		e.classList.add('show');
	}
}

var frames = {
	'normal': 'horse.png',
	'leg-up': 'horse-leg-up.png',
	'leg-down': 'horse-leg-down.png',
	'ear-twitch': 'horse-ear-twitch.png',
	'head-up': 'horse-head-up.png',
	'head-down': 'horse-head-down.png'
}

var animations = {
	'twitch': [
		{frame: 'ear-twitch',duration:50},
		{frame: 'normal',duration:100}
	],
	'head-shake': [
		{frame: 'head-down',duration:150},
		{frame: 'normal',duration:50},
		{frame: 'head-up',duration:150},
		{frame: 'normal',duration:50}
	],
	'not-understood': [
		{frame: 'head-down',duration:150,sound:'hrmph',state:'not-understood'},
		{frame: 'normal',duration:50},
		{frame: 'ear-twitch',duration:50},
		{frame: 'normal',duration:50, state:'listening'}
	],
	'start-counting': [
		{frame:'head-up',duration:500}
	],
	'count': [
		{frame:'leg-up',duration:200},
		{frame:'leg-down',duration:500, sound: 'clop'}
	],
	'end-counting': [
		{frame:'normal',duration:1500,state:'listening'},
		{frame:'ear-twitch',duration:50},
		{frame:'normal',duration:100},
		{frame:'head-down',duration:100}
	]

}

var sounds = {
	'clop': 'clop.mp3',
	'neigh': 'neigh.mp3',
	'hrmph': 'hrmph.mp3'
}
for(var s in sounds) {
	sounds[s] = new Audio('sounds/'+sounds[s])
}

function Hans() {
	var h = this;
	h.set_frame('normal');
	h.state = 'not-listening';
	if(!'webkitSpeechRecognition' in window) {
		error('no-speech-recognition');
		return;
	}
	var r = this.recognition = new webkitSpeechRecognition();
	r.continuous = true;
	r.interimResults = true;

	r.start();

	r.onstart = function() {
		h.set_state('listening');
		//error('speech-not-allowed',true);
	}

	r.onerror = function(e) {
		switch(e.error) {
			case 'not-allowed':
				error('speech-not-allowed');
				break;
		}
	}

	r.onresult = function(e) {
		var transcript = '';
		var interim = '';
		for(var i = e.resultIndex; i<e.results.length;i++) {
			if(e.results[i].isFinal) {
				transcript += e.results[i][0].transcript;
			} else {
				interim += e.results[i][0].transcript;
			}
		}
		document.getElementById('interim').innerText = interim;
		if(transcript && h.state=="listening") {
			h.ask(transcript);
		}
	} 
	r.onend = function() {
		//r.start();
	}

	var twitchAcc = 0;
	setInterval(function() {
		if(h.state!='listening') {
			return;
		}
		if(twitchAcc>0) {
			twitchAcc -= 1;
			return;
		}
		if(Math.random()<0.2) {
			twitchAcc = 3;
			var animation;
			if(Math.random()<0.5) {
				animation = animations['twitch'];
			} else {
				animation = animations['head-shake'];
			}
			if(Math.random()<0.1) {
				//h.play_sound('hrmph');
			}
			h.animate(animation);
		}
	},500);
}
Hans.prototype = {
	set_state(state) {
		console.log('state',state);
		this.state = state;
		switch(state) {
			case 'not-listening':
				this.set_frame('normal');
				break;
			case 'listening':
				this.set_frame('head-down');
				break;
			case 'not-understood':
				this.set_frame('ear-twitch');
				break;
		}
	},

	animate: function(frames) {
		this.animation = frames.slice();
		this.next_frame();
	},

	next_frame: function() {
		var h = this;
		if(!this.animation.length) {
			return;
		}
		var frame = this.animation.shift();
		if(frame.state!==undefined) {
			this.set_state(frame.state);
		}
		if(frame.sound!==undefined) {
			this.play_sound(frame.sound);
		}
		this.set_frame(frame.frame);
		setTimeout(function() {
			h.next_frame();
		},frame.duration);
	},

	set_frame: function(frame) {
		this.frame = frame;
		document.getElementById('hans').src = 'images/'+frames[frame];
	},

	play_sound: function(sound) {
		sounds[sound].play();
	},

	ask: function(question) {
		this.reply('"'+question+'"');
		try {
			question = question.trim().toLowerCase();
			var result = parser.parse(question);
		} catch(e) {
			this.reply('neigh');
			this.set_state('not-understood');
		}

		if(!result) {
			this.animate(animations['not-understood']);
			return;
		}

		this.set_state('answering');

		this.reply(JSON.stringify(result));

		var n = evaluate(result.terms);
		this.reply(n);

		if(n<1) {
			this.animate(animations['not-understood']);
			return;
		}

		var animation = animations['start-counting'].slice();
		for(var i=0;i<n;i++) {
			animation = animation.concat(animations['count']);
		}
		animation = animation.concat(animations['end-counting']);
		this.animate(animation);
	},

	reply: function(msg) {
		console.log(msg);
		//var final = document.getElementById('final');
		//final.innerHTML += '<p>'+msg+'</p>';  
	},

}
function evaluate(terms,n) {
	n = n || 0;

	terms.forEach(function(term) {
		if(term.number!==undefined) {
			n = term.number;
		} else if(term.op) {
			switch(term.op) {
				case '+':
					n += evaluate([term.n]);
					break;
				case '-':
					n -= evaluate([term.n]);
					break;
				case '*':
					n *= evaluate([term.n]);
					break;
				case '/':
					n /= evaluate([term.n]);
					break;
				case 'sqrt':
					if(term.n!==undefined) {
						n = Math.sqrt(evaluate([term.n]))
					} else {
						n = Math.sqrt(n);
					}
					break;
				case 'squared':
					if(term.n!==undefined) {
						n = Math.pow(evaluate([term.n]),2);
					} else {
						n = Math.pow(n,2);
					}
					break;
			}
		}
	});

	return n;
}

var hans = new Hans();
