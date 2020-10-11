const { cors } = require('./utils/cors');
const { events } = require('./functions/events');
const { event } = require('./functions/event');

exports.event = cors(event);
exports.events = cors(events);
