module('users.wwj.dynatalk').requires().toRun(function() {

Object.subclass('PostMessageSpace', // used global variable: window.space
'initialize-release', {
  initialize: function(aSupervisor, pageType) {
    this.supervisor = aSupervisor;
    
    this.pageType = pageType // parent or child
    // There are two types of pages: parent page or child page(iframe page). The only difference is the way of sending the message
    
    // handle the messages sent to the current page
    if (window._handlePostMessage){
      window.removeEventListener('message', window._handlePostMessage);
    }
    window._handlePostMessage = (event) => {
        let topic = event.origin;
        let message = event.data;
        console.log('Received message', event.data);
        this.onMessage(topic, message);
    }
    window.addEventListener('message', window._handlePostMessage);
  },
},
'default category', {

    _publish: function(topic, payload) {
      // topic: iframe_id
      if (this.pageType === "parent"){
        const iframe_id = `snap_iframe_${topic}`;
        let iframe = document.getElementById(iframe_id);
        if (iframe){
          console.log(`${this.pageType} send ${payload}`)
          iframe.contentWindow.postMessage(payload, '*');
        }
      }

      if (this.pageType === "child"){
        // ignore id
        window.parent.postMessage(payload, "*");
      }

    },

    onMessage: function(topic, payload) {
        console.debug(`(space ${this.pageType}) onMessage: ${payload.toString()}`);
        // Prevent the mqtt message process from being broken
        try{
          this.supervisor.onMessage(topic, payload);
        } catch(e) {
          console.error(e);
        }
        
    },
});
Object.subclass('Agent',
'actions', {
  ping: function(){
    this.respondWith("pong")
  },
},
'debugging', {},
'evaluating', {
  _commit: function(message) {
    /*
    Invokes the action method

    Args:
          message: The incoming message specifying the action
    */
    try {
      // todo policy
      let action_method = this[message.action.name]; 
      // todo not understood
      if (action_method){
        // function bind to the object 
        action_method.bind(this)(...message.action.args);
      } else {
        let error = `Message Not Understood: ${message["to"]}>>${message["action"]["name"]}`;
        console.error(error);
        this.raiseWith(error);
      }
      
      
    } catch(e) {
      let error = `${this.id}>>${message['action']['name']} raised exception:` + e
      console.error(error);
      this.raiseWith(error);
      
    }
  },
  interpret: function(message) {
    // The object interprets the message it understands

    if (this._RESPONSE_ACTION_NAME === message.action.name) {
      // Handle incoming responses. Only useful when agent is used as callee
      console.debug("Handle incoming response", message);
      
      // process help response
      if (message.action.args.value && message.action.args.value.help){
        this.availableActions[message.from] = message.action.args.value.help
      }

      // process _promises
      this._promises[message.meta.parent_id] && this._promises[message.meta.parent_id].resolve(message.action.args.value);
      delete this._promises[message.meta.parent_id];
    } 
    else if (this._ERROR_ACTION_NAME === message.action.name){
      console.debug("Handle incoming error", message);
      // process _promises
      this._promises[message.meta.parent_id] && this._promises[message.meta.parent_id].reject(message.action.args.error);
      delete this._promises[message.meta.parent_id];
    }
    else {
      // the caller requests the agent to execute the command
      this._commit(message)
    }
  },
},
'help', {
  broadcastHelp: function(){
    this.broadcast("help", [])
  },
},
'initialize-release', {
  initialize: function(agentID, receive_own_broadcasts=false) {
    // let testAgent = new Agent("testAgent")
    this._RESPONSE_ACTION_NAME = "[response]";
    this._ERROR_ACTION_NAME = "[error]";
    this.broadcastFlag = "[broadcast]";
    this._promises = {}; // for request;
    this.availableActions = {};
    
    this.supervisor = null;
    this.id = agentID || this.constructor.name;
    this.current_message = null;
    
  },
    setSupervisor: function(supervisor) {
        this.supervisor = supervisor;
    },
},
'public api', {
  raiseWith: function(error) {
    /*
    Sends an error response.

    Args:
        error: The error to send.
    */
    let parent_id = this.current_message.meta.id;
    let to = this.current_message.from;
    let action = this._ERROR_ACTION_NAME;
    let args = {"error": error};
    let message = this.generateMessage(parent_id, to, action, args)
    
    this.send(message);
  },
  
  respondWith: function(value) {
    // Sends a response with the given value.
    let parent_id = this.current_message.meta.id;
    let to = this.current_message.from;
    let action = this._RESPONSE_ACTION_NAME;
    let args = {"value": value};
    let message = this.generateMessage(parent_id, to, action, args)
    
    this.send(message);
  },
  request: function(agentName, actionName, args) {
        let parentID = null;
        let message = this.generateMessage(parentID, agentName, actionName, args);
        return this._request(message);
  },
  sendTo: function(agentName, actionName, args) {
        let parentID = null;
        let message = this.generateMessage(parentID, agentName, actionName, args);
        return this.send(message);
  },
    broadcast: function(actionName, args) {
        this.sendTo(this.broadcastFlag, actionName, args);
    },
},
'receiving', {
  _receive: function(message) {
    // Receives and handles an incoming message.
    console.debug(`(${this.id}) received message`, message)
    this.current_message = message;
    this.interpret(this.current_message);
  },
},
'sending', {

  _request: function(message, timeout=3000) {
    // send and wait the response
    // timeout 3000 ms
    let msg_id = this.send(message);
    
    return new Promise((resolve, reject) => {
        this._promises[msg_id] = {resolve:resolve, reject:reject};
        setTimeout(() => {
            if (this._promises[msg_id]){
                console.debug(this._promises);
                let error = `request(${msg_id}) timeout(${timeout}ms)`;
                console.error(error);
                reject(error);
            }
        }, timeout);
    });
  },


  send: function(message) {
    /*
    Sends (out) a message from this agent.
    
    Args:
          message: The message

    Returns:
          The meta.id of the sent message
    */
    
  
    console.debug(`(${this.id}) sending `, message)
    // this._outbound_queue.put(message) // todo loop, now is directly
    this.supervisor.send(message);
    return message.meta.id
  },
    generateMessage: function(parentID, to, action, args) {
      let message = {
                        "meta": {
                            "id": ""
                        },
                        "from": "",
                        "to": "",
                        "action": {
                            "name": "",
                            "args": ""
                        }
                    };
                    
      if (parentID){message.meta.parent_id = parentID};
      message.meta.id = crypto.randomUUID();
      message.to = to;
      message.from = this.id;
      message.action.name = action;
      message.action.args = args;
      
      return message;
    },

},
'converting', {},
'default category', {

});
Agent.subclass('LivelyDemoAgent',
'default category', {
    echo: function(content) {
      log(`echo: ${content}`)
      this.respondWith(content);
    },
    help: function() {
      let help = {
          "add": {
              "description": "add a and b",
              "args": ["aNumber", "aNumber"]
            },
          "echo": {
              "description": "echo the content",
              "args": ["aString"]
            }
          }
      this.respondWith({"help": help});
    },

    add: function(a, b) {
        this.respondWith(a+b);
    }
});
Agent.subclass('LivelyEvalAgent',
'default category', {
    eval: function(code) {
      let result = eval(code)
      this.respondWith(result); 
    },
});
Object.subclass('Supervisor',
'accessing', {
  getAgent: function(agentID) {
    return this.agents[agentID]
  },
    addAgent: function(agent) {
        agent.setSupervisor(this);
        this.agents[agent.id] = agent;
    },
},
'converting', {
  parseToJson: function(payload) {
    let result;
    try {
        result = JSON.parse(payload.toString()); // json
        // verify, console.assert does not terminate code
        if (this.isValid(result)) {
          return result
        } else {
          log("(Supervisor) bad message")
        }
    } catch(e) {
        alert("Supervisor parseToJson error: " + e);
    }
    return null;
  },
},
'initialize-release', {
  initialize: function(pageType) {
    this.broadcastFlag = "[broadcast]";
    this.agents = {};
    // this.initAgents();
    
    this.space = new PostMessageSpace(this, pageType);
  },
  initAgents: function() {
    // todo: Dynamically manage agent life cycle
    
    let agent = new LivelyDemoAgent("LivelyDemoAgent");
    this.addAgent(agent);
    
  },
},
'testing', {
  isValid: function(message) {
    // message: json
    return ("from" in message && "to" in message && "action" in message)
  },
},
'documentation', {
    documentation: "manage agents",
},
'default category', {
    onMessage: function(topic, payload) {
      // route message to agents
      let message = this.parseToJson(payload); // mutation
      if (message){
        console.debug("(Supervisor) valid message: ", message);
        
        if (message.to === this.broadcastFlag){
          for (let i in this.agents){this.agents[i]._receive(message)}
        }
        
        if (message.to in this.agents){
          this.agents[message.to]._receive(message)
        }
      }
    },

    send: function(message) {
        let routing_key = message.to;
        this.space._publish(routing_key, JSON.stringify(message))
    },
});


}) // end of module
