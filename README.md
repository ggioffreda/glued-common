GluedJS - Common Utilities
==========================

Collection of common utilities for GluedJS micro services. Not to do the same boring
things over and over again.

Utilities
---------

Available utilities are:

- [Data Layer initialisation](#data-layer-initialisation)
- [Message Bus initialisation](#message-bus-initialisation)
- [Processor Manager](#processor-manager)

### Data Layer initialisation

You can initialise the data layer for your micro service simply requiring it from this
library. To customise the options for RethinkDB you can specify the location of your
configuration file using the **GLUED_RETHINKDB** environment variable on service start up.
If not provided the data layer will be created with an empty configuration.

For a real life example have a look at the 
[GluedJS Store](https://github.com/ggioffreda/glued-store). Its server makes use of this
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
[GluedJS Store](https://github.com/ggioffreda/glued-store). Its server makes use of this
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

### Processor Manager

The processor manager allows you to focus on the business logic of your message 
processor by doing all the boring initialisation stuff for you. All your processor needs
to do is implementing a *requires(dependency)* and a *setUp(dependencies)* methods.

The *requires* method will be used by the manager to understand what dependencies to
provide when setting up your processor by calling the *setUp* method.

If your processor does not define a *requires* method, nothing will be injected during
set up. Although if you don't need to inject any dependency it's kind of pointless to 
use the manager. If your processor does not define a *setUp* method an error will be
raised.

The available dependencies that can be required are:

- **data-layer**: the [data layer](https://github.com/ggioffreda/glued-data-layer) 
  instance to access the objects directly. This is not the advised way of manipulating
  objects, object manipulation should always be done through the
  [store](https://github.com/ggioffreda/glued-store);

- **message-bus**: the communication bus for publishing messages and subscribing to 
  topics. This will be an instance of *MessageBusChannel* as defined in
  [GluedJS - Message Bus](https://github.com/ggioffreda/glued-message-bus)
  
The only method exposed by the *ProcessorManager* is *load(processor)*.

Example of simple processor:

```javascript
function MyProcessor() {
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

You can then load your processor like so:

```javascript
const ProcessorManager = require('glue-common').ProcessorManager,
  manager = new ProcessorManager(); // this will initialise a new manager
  
manager.load(new MyProcessor());
```
