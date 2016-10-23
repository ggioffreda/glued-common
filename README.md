Glue - Common Utilities
=======================

Collection of common utilities for Glue micro services.

[![Build Status](https://travis-ci.org/ggioffreda/glued-common.svg?branch=master)](https://travis-ci.org/ggioffreda/glued-common)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Utilities
---------

Available utilities are:

- [Data Layer initialisation](#data-layer-initialisation)
- [Message Bus initialisation](#message-bus-initialisation)
- [Service Manager](#service-manager)
- [Service Monitor](#service-monitor)

### Data Layer initialisation

You can initialise the data layer for your micro service simply requiring it from this
library. To customise the options for RethinkDB you can specify the location of your
configuration file using the **GLUED_RETHINKDB** environment variable on service start up.
If not provided the data layer will be created with an empty configuration.

For a real life example have a look at the 
[Glue Store](https://github.com/ggioffreda/glued-store). Its server makes use of this
and the message bus initialisation below.

Example:

```javascript
#!/usr/bin/env node

const glued = require('glued-common'),
  dataLayer = glued.dataLayer;

dataLayer.connectModule(function (err, dataLayer) {
  if (err) {
    console.error('Cannot connect to RethinkDB. Check that it is installed and running.');
    throw err;
  }

  // you sure want to do something here ...
});
```

### Message Bus initialisation

You can set up the message bus for your micro service simply requiring it from this
library. To customise the AMQP server and exchange you can use the following environment
variables:

- **GLUED_AMQP**: the URI of the AMQP server, default to `amqp://localhost`;
  
- **GLUED_MESSAGE_BUS**: the name of the AMQP exchange, default to 
  `glued_message_bus`;
  
For a real life example have a look at the 
[Glue Store](https://github.com/ggioffreda/glued-store). Its server makes use of this
and the data layer initialisation above.

Example:

```javascript
#!/usr/bin/env node

const glued = require('glued-common'),
  messageBus = glued.messageBus;

messageBus.connectModule(function (err, messageBusChannel) {
  if (err) {
    console.error('Cannot connect to the AMQP server. Try installing and running RabbitMQ.');
    throw err;
  }

  // you sure want to do something here ...
});
```

### Service Manager

The service manager allows you to focus on the business logic of your message 
service by doing all the boring initialisation stuff for you. All your service needs
to do is implementing a *requires(dependency)* and a *setUp(dependencies)* methods.

The *requires* method will be used by the manager to understand what dependencies to
provide when setting up your service by calling the *setUp* method.

If your service does not define a *requires* method, nothing will be injected during
set up. Although if you don't need to inject any dependency it's kind of pointless to 
use the manager. If your service does not define a *setUp* method an error will be
raised.

The available dependencies that can be required are:

- **data-layer**: the [data layer](https://github.com/ggioffreda/glued-data-layer) 
  instance to access the objects directly. This is not the advised way of manipulating
  objects, object manipulation should always be done through the
  [store](https://github.com/ggioffreda/glued-store);

- **message-bus**: the communication bus for publishing messages and subscribing to 
  topics. This will be an instance of *MessageBusChannel* as defined in
  [Glue Message Bus](https://github.com/ggioffreda/glued-message-bus)
  
The only method exposed by the *ServiceManager* is *load(service)*.

Example of simple service:

```javascript
function MyService() {
  // this is the most common use case, you'll need only the message bus
  this.requires = function (dependency) {
    return 'message-bus' === dependency;
  };
  
  // the dependencies object will be:
  // { "data-layer": null, "message-bus": messageBusInstance }
  this.setUp = function (dependencies) {
    // set up logic here ...
  };
}
```

You can then load your service like so:

```javascript
const ServiceManager = require('glue-common').ServiceManager,
  manager = new ServiceManager(); // this will initialise a new manager
  
manager.load(new MyService(), require('./package.json'));
```

The second parameter is optional but it's useful to provide it so the monitor
can expose the version of the micro service.

### Service Monitor

The service monitor provides a common interface across Glue services for
checking their health status and fetching useful information. To automatically
activate monitoring make sure your service defines its name through the 
`getName()` method.

#### Health check

Pinging is useful for making sure services are running. The micro services
will reply with a pong message on the topic
**monitor.pong.<service name>.<service ID>** with the Unix timestamp as
content of the message.

Each monitored service listens for ping requests on the following topics:

- **ping.monitor** all services will reply to this message with a pong;
- **ping.<service name>.monitor** only the specified service will reply to 
  this message, if multiple instances of the same services are running they
  will all reply with a pong;
- **ping.<service name>.<service ID>.monitor** only the specified instance
  of the specified service will reply to this message with a pong.

#### Monitoring the internal state

Monitoring the internal state of a service can provide useful information
for logging, statistics or load balancing purposes. Each services
internally defines a set of properties to expose upon request and will
broadcast them on the topic
**monitor.state.<service name>.<service ID>**. All services will also
expose by default the uptime of the service, its version and the hostname
of the machine they are running on. For example:

```json
{
   "state": {
     "internal_state": "goes here"
   },
   "uptime": 123456,
   "version": "v1.2.3",
   "hostname": "some.example.com"
}
```

Each monitored service listens for internal state requests on the
following topics:

- **state.monitor** all services will broadcast their internal state;
- **state.<service name>.monitor** only the specified service will
  broadcast its state, if multiple instances of that same service are
  running then all of them will broadcast;
- **state.<service name>.<service ID>.monitor** only the specified instance
  of the given service will broadcast its state.
  
#### Host information

This is useful for getting detailed information about the host machine.
Each service targeted by the request will broadcast on the topic
**monitor.state.<service name>.<service ID>**, exposing:

- os.arch
- os.cpus
- os.endianness
- os.freemem
- os.homedir
- os.hostname
- os.loadavg
- os.network_interfaces
- os.platform
- os.release
- os.tmpdir
- os.totalmem
- os.type
- os.uptime

The service monitor internally uses the [Node.js OS module](https://nodejs.org/dist/latest-v4.x/docs/api/os.html)
for retrieving the above information, you can refer to the official 
documentation for a more detailed explanation about each item.

All monitored services will listen on the following topics:

- **info.monitor** all services will broadcast information about the host;
- **info.<service name>.monitor** only the matching service will broadcast
  information about its host, if multiple instances are running then all of
  them will broadcast;
- **info.<service name>.<service ID>.monitor** the specified instance of 
  the given service will broadcast its host information.
