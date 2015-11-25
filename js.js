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
		{frame: 'head-down',duration:150,sound:'neigh',state:'not-understood'},
		{frame: 'normal',duration:50},
		{frame: 'ear-twitch',duration:50},
		{frame: 'normal',duration:500},
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
	],
	'love': [
		{frame: 'head-down',duration:150, state: 'love', sound: 'neigh'},
		{frame: 'normal',duration:50},
		{frame: 'head-up',duration:150},
		{frame: 'normal',duration:50},
		{frame: 'head-down',duration:150},
		{frame: 'normal',duration:50},
		{frame: 'head-up',duration:150},
		{frame: 'normal',duration:50},
		{frame: 'ear-twitch',duration:50},
		{frame: 'normal',duration:100},
		{frame: 'ear-twitch',duration:50},
		{frame: 'normal',duration:100},
		{frame: 'ear-twitch',duration:50},
		{frame: 'normal',duration: 500},
		{frame: 'head-down',duration: 500},
		{frame: 'normal',duration: 100, state: 'listening'}
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

var state_descriptions = {
	'not-listening': 'Hans is not listening. Tap to get his attention.',
	'listening': 'Hans is listening.',
	'answering': 'Hans has the answer!',
	'not-understood': 'Neigh?',
	'love': 'Hans loves you too!'
}

function Hans() {
	var h = this;
	h.set_frame('normal');
	h.state = 'not-listening';
	if(!'webkitSpeechRecognition' in window) {
		error('no-speech-recognition');
		return;
	}

	h.listening = false;

	var r = this.recognition = new webkitSpeechRecognition();
	r.continuous = true;
	r.interimResults = true;

	r.start();

	document.body.onclick = function() {
		if(h.listening) {
			r.stop();
		} else {
			r.start();
			h.play_sound('hrmph');
		}
	}

	r.onstart = function() {
		h.set_state('listening');
		h.set_frame('head-down');
		h.listening = true;
	}

	r.onerror = function(e) {
		console.log("Speech error",e.error,e);
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
		h.set_state('not-listening');
		h.listening = false;
	}

	window.onresize = function() {
		h.resize();
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
			if(Math.random()<0.8) {
				animation = animations['twitch'];
			} else {
				animation = animations['head-shake'];
				h.play_sound('hrmph');
			}
			h.animate(animation);
		}
	},500);
	h.resize();
}
Hans.prototype = {
	resize: function() {
		var w = window.innerWidth*0.9;
		var h = window.innerHeight-130;
		h = h*200/165;
		w = Math.min(w,h);
		document.getElementById('hans').style.width = w+'px';
	},
	set_state: function(state) {
		console.log('state',state);
		document.getElementById('status').innerText = state_descriptions[state];
		this.state = state;
		switch(state) {
			case 'not-listening':
				this.set_frame('normal');
				break;
			case 'listening':
				this.set_frame('head-down');
				document.getElementById('status').classList.add('listening');
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
		if(this.next_frame_timeout) {
			clearTimeout(this.next_frame_timeout);
		}
		this.next_frame_timeout = setTimeout(function() {
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
			return this.neigh();
		}

		if(!result) {
			return this.neigh();
		}

		this.set_state('answering');

		this.reply(JSON.stringify(result));

		switch(result.question) {
			case 'calculate':
				this.calculate(result.terms);
				break;
			case 'love':
				this.animate(animations['love']);
				break;
		}
	},

	neigh: function() {
		this.animate(animations['not-understood']);
	},

	calculate: function(terms) {
		var n = evaluate(terms);
		this.reply(n);

		if(n<1 || n>100) {
			return this.neigh();
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
	},

}
function evaluate(terms,n) {
	n = n || 0;

	terms.forEach(function(term) {
		if(term.number!==undefined) {
			n = term.number;
		} else if(term.op) {
			n = ops[term.op](term,n);
		}
	});

	return n;
}

var ops = {
	'+': function(term,n) {
		return n + evaluate([term.n]);
	},
	'-': function(term,n) {
		return n - evaluate([term.n]);
	},
	'*': function(term,n) {
		return n * evaluate([term.n]);
	},
	'/': function(term,n) {
		return n / evaluate([term.n]);
	},
	'^': function(term,n) {
		return Math.pow(n,evaluate([term.n]));
	},
	'sqrt': function(term,n) {
		n = term.n!==undefined ? evaluate([term.n]) : n;
		return Math.sqrt(n);
	},
	'squared': function(term,n) {
		n = term.n!==undefined ? evaluate([term.n]) : n;
		return n*n;
	},
	'cubed': function(term,n) {
		n = term.n!==undefined ? evaluate([term.n]) : n;
		return n*n*n;
	},
	'factorial': function(term,n) {
		n = term.n!==undefined ? evaluate([term.n]) : n;
		return factorial(n);
	},
	'gcd': function(term,n) {
		a = Math.floor(evaluate(term.a));
		b = Math.floor(evaluate(term.b));
		return gcd(a,b);
	},
	'lcm': function(term,n) {
		a = Math.floor(evaluate(term.a));
		b = Math.floor(evaluate(term.b));
		return lcm(a,b);
	},
}

function factorial(n) {
	n = Math.floor(n);
	if(n<=1) {
		return 1;
	}
	var t = 1
	for(var i=2;i<=n;i++) {
		t *= i;
	}
	return t;
}
function gcd(a,b) {
	while(b>=1) {
		var t = a%b;
		a = b;
		b = t;
	}
	return a;
}
function lcm(a,b) {
	return a*b/gcd(a,b);
}

var hans = new Hans();
