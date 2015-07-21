/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 **/

var ticketSchema    = require('../models/ticket');
var async           = require('async');
var path            = require('path');
var _               = require('underscore');
var _s              = require('underscore.string');
var flash           = require('connect-flash');
var winston         = require('winston');
var groupSchema     = require('../models/group');
var typeSchema      = require('../models/tickettype');
var emitter         = require('../emitter');

/**
 * @since 1.0
 * @author Chris Brame <polonel@gmail.com>
 * @copyright 2015 Chris Brame
 **/

/**
 * @namespace
 * @description Controller for each Ticket View
 * @requires {@link Ticket}
 * @requires {@link Group}
 * @requires {@link TicketType}
 * @requires {@link Emitter}
 *
 * @todo Redo Submit Ticket static function to submit ticket over API only.
 * @todo Redo Post Comment static function to only allow comments over API.
 */
var ticketsController = {};

/**
 * @name ticketsController.content
 * @description Main Content sent to the view
 */
ticketsController.content = {};

/**
 * Get Default Ticket View
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Tickets View
 * @see Ticket
 * @example
 * //Content Object
 * self.content.title = "Tickets";
 * self.content.nav = 'tickets';
 *
 * self.content.data = {};
 * self.content.data.user = req.user;
 * self.content.data.common = req.viewdata;
 *
 * //Ticket Data
 * self.content.data.tickets = [{{@link Ticket}}];
 */
ticketsController.get = function(req, res) {
    var self = this;
    self.content = {};
    self.content.title = "Tickets";
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    //Ticket Data
    self.content.data.tickets = {};
    async.waterfall([
        function(callback) {
            groupSchema.getAllGroupsOfUser(req.user._id, function(err, grps) {
                callback(err, grps);
            })
        },
        function(grps, callback) {
            ticketSchema.getTickets(grps, function(err, results) {

                callback(err, results);
            });
        }
    ], function(err, results) {
        if (err) return handleError(res, err);

        self.content.data.tickets = results;

        res.render('tickets', self.content);
    });
};

/**
 * Get Ticket View based on ticket status
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Tickets View
 * @see Ticket
 * @example
 * //Content Object
 * self.content.title = "Tickets";
 * self.content.nav = 'tickets';
 * self.content.subnav = 'tickets-{status}';
 *
 * self.content.data = {};
 * self.content.data.user = req.user;
 * self.content.data.common = req.viewdata;
 *
 * //Ticket Data
 * self.content.data.tickets = [{Ticket}];
 */
ticketsController.getByStatus = function(req, res) {
    var url = require('url');
    var self = this;
    self.content = {};
    self.content.title = "Tickets";
    self.content.nav = 'tickets';
    self.content.subnav = 'tickets-';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    var pathname = url.parse(req.url).pathname;
    var arr = pathname.split('/');
    var tType = 'new';
    var s  = 0;
    if (_.size(arr) > 2) tType = arr[2];

    switch (tType) {
        case 'new':
            s = 0;
            break;
        case 'open':
            s = 1;
            break;
        case 'pending':
            s = 2;
            break;
        case 'closed':
            s = 3;
            break;
        default:
            s = 0;
            break;
    }

    self.content.subnav += tType;
    //Ticket Data
    self.content.data.tickets = {};
    async.waterfall([
        function(callback) {
            groupSchema.getAllGroupsOfUser(req.user._id, function(err, grps) {
                callback(err, grps);
            });
        },
        function(grps, callback) {
            ticketSchema.getTicketsByStatus(grps, s, function(err, results) {

                callback(err, results);
            });
        }
    ], function(err, results) {
        if (err) return handleError(res, err);

        self.content.data.tickets = results;

        res.render('tickets', self.content);
    });
};

/**
 * Get Ticket View based on ticket active tickets
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Tickets View
 * @see Ticket
 * @example
 * //Content Object
 * self.content.title = "Tickets";
 * self.content.nav = 'tickets';
 * self.content.subnav = 'tickets-active';
 *
 * self.content.data = {};
 * self.content.data.user = req.user;
 * self.content.data.common = req.viewdata;
 *
 * //Ticket Data
 * self.content.data.tickets = [{Ticket}];
 */
ticketsController.getActive = function(req, res) {
    var url = require('url');
    var self = this;
    self.content = {};
    self.content.title = "Tickets";
    self.content.nav = 'tickets';
    self.content.subnav = 'tickets-active';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    //Ticket Data
    self.content.data.tickets = {};
    async.waterfall([
        function(callback) {
            groupSchema.getAllGroupsOfUser(req.user._id, function(err, grps) {
                callback(err, grps);
            });
        },
        function(grps, callback) {
            ticketSchema.getTicketsByStatus(grps, 0, function(err, results0) {
                if (err) return callback(err);

                ticketSchema.getTicketsByStatus(grps, 1, function(err, results1) {
                    if (err) return callback(err);

                    ticketSchema.getTicketsByStatus(grps, 2, function(err, results2) {
                        if (err) return callback(err);

                        var combined = _.union(results0, results1, results2);

                        callback(null, combined);
                    });
                });
            });
        }
    ], function(err, results) {
        if (err) return handleError(res, err);

        self.content.data.tickets = results;

        res.render('tickets', self.content);
    });
};

/**
 * Get Ticket View based on tickets assigned to a given user
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Tickets View
 * @see Ticket
 * @example
 * //Content Object
 * self.content.title = "Tickets";
 * self.content.nav = 'tickets';
 * self.content.subnav = 'tickets-assigned';
 *
 * self.content.data = {};
 * self.content.data.user = req.user;
 * self.content.data.common = req.viewdata;
 *
 * //Ticket Data
 * self.content.data.tickets = [{Ticket}];
 */
ticketsController.getAssigned = function(req, res) {
    var url = require('url');
    var self = this;
    self.content = {};
    self.content.title = "Tickets";
    self.content.nav = 'tickets';
    self.content.subnav = 'tickets-assigned';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    //Ticket Data
    self.content.data.tickets = {};
    async.waterfall([
        function(callback) {
            groupSchema.getAllGroupsOfUser(req.user._id, function(err, grps) {
                if (err) return callback(err);

                callback(null, grps);
            });
        },
        function(grps, callback) {
            ticketSchema.getAssigned(req.user._id, function(err, tickets) {
                if (err) return callback(err);

                callback(null, tickets);
            })
        }
    ], function(err, results) {
        if (err) return handleError(res, err);

        self.content.data.tickets = results;

        res.render('tickets', self.content);
    });
};

/**
 * Get Create Ticket View
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Tickets View
 */
ticketsController.create = function(req, res) {
    var self = this;
    self.content = {};
    self.content.title = "Tickets - Create";
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    async.parallel({
        groups: function (callback) {
            groupSchema.getAllGroupsOfUser(req.user._id, function (err, objs) {
                callback(err, objs);
            });
        },
        types: function(callback) {
            typeSchema.getTypes(function(err, objs) {
                callback(err, objs);
            });
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = _.sortBy(results.groups, 'name');
            if (!_.isUndefined(results.types)) self.content.data.ticketTypes = results.types;

            res.render('subviews/createTicket', self.content);
        }
    });
};

/**
 * Print Ticket View
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Subviews/PrintTicket View
 */
ticketsController.print = function(req, res) {
    var self = this;
    var user = req.user;
    var uid = req.params.id;
    self.content = {};
    self.content.title = "Tickets - " + req.params.id;
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.ticket = {};

    ticketSchema.getTicketByUid(uid, function(err, ticket) {
        if (err) return handleError(res, err);
        if (_.isNull(ticket) || _.isUndefined(ticket)) return res.redirect('/tickets');

        if (!_.any(ticket.group.members, user._id)) {
            winston.warn('User access ticket outside of group - UserId: ' + user._id);
            return res.redirect('/tickets');
        }

        self.content.data.ticket = ticket;
        self.content.data.ticket.priorityname = getPriorityName(ticket.priority);
        self.content.data.ticket.tagsArray = ticket.tags;
        self.content.data.ticket.commentCount = _.size(ticket.comments);
        self.content.layout = 'layout/print';

        return res.render('subviews/printticket', self.content);
    });
};

/**
 * Get Single Ticket view based on UID
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Single Ticket View
 * @see Ticket
 * @example
 * //Content Object
 * self.content.title = "Tickets - " + req.params.id;
 * self.content.nav = 'tickets';
 *
 * self.content.data = {};
 * self.content.data.user = req.user;
 * self.content.data.common = req.viewdata;
 *
 * //Ticket Data
 * self.content.data.ticket = ticket;
 * self.content.data.ticket.priorityname = getPriorityName(ticket.priority);
 * self.content.data.ticket.tagsArray = ticket.tags;
 * self.content.data.ticket.commentCount = _.size(ticket.comments);
 */
ticketsController.single = function(req, res) {
    var self = this;
    var user = req.user;
    var uid = req.params.id;
    self.content = {};
    self.content.title = "Tickets - " + req.params.id;
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.ticket = {};

    ticketSchema.getTicketByUid(uid, function(err, ticket) {
        if (err) return handleError(res, err);
        if (_.isNull(ticket) || _.isUndefined(ticket)) return res.redirect('/tickets');

        if (!_.any(ticket.group.members, user._id)) {
            winston.warn('User access ticket outside of group - UserId: ' + user._id);
            return res.redirect('/tickets');
        }

        self.content.data.ticket = ticket;
        self.content.data.ticket.priorityname = getPriorityName(ticket.priority);
        self.content.data.ticket.tagsArray = ticket.tags;
        self.content.data.ticket.commentCount = _.size(ticket.comments);

        return res.render('subviews/singleticket', self.content);
    });
};

/**
 * Converts the Prioirty Int to Readable Name
 * @memberof ticketsController
 * @instance
 * @param {Number} val Int Value of the Prioirty to convert
 * @returns {string} Readable String for Priority
 */
function getPriorityName(val) {
    var p = '';
    switch(val) {
        case 1:
            p = 'Normal';
            break;
        case 2:
            p = 'Urgent';
            break;
        case 3:
            p = 'Critical';
            break;
    }

    return p;
}

/**
 * Get Edit Ticket View
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Edit Ticket View
 * @see Ticket
 * @example
 * //Content Object
 * self.content.title = "Edit Ticket #" + req.params.id;
 * self.content.nav = 'tickets';
 *
 * self.content.data = {};
 * self.content.data.user = req.user;
 * self.content.data.common = req.viewdata;
 *
 * //Ticket Data
 * self.content.data.ticket = ticket;
 * self.content.data.ticket.priorityname = getPriorityName(ticket.priority);
 * self.content.data.ticket.tagsArray = ticket.tags;
 * self.content.data.ticket.commentCount = _.size(ticket.comments);
 *
 * if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;
 * if (!_.isUndefined(results.types)) self.content.data.ticketTypes = results.types;
 * if (!_.isUndefined(results.ticket)) self.content.data.ticket = results.ticket;
 */
ticketsController.editTicket = function(req, res) {
    var self = this;
    var uid = req.params.id;
    self.content = {};
    self.content.title = "Edit Ticket #" + req.params.id;
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.ticket = {};

    async.parallel({
        groups: function (callback) {
            groupSchema.getAllGroups(function (err, objs) {
                callback(err, objs);
            });
        },
        types: function(callback) {
            typeSchema.getTypes(function(err, objs) {
                callback(err, objs);
            });
        },
        ticket: function(callback) {
            ticketSchema.getTicketByUid(uid, function(err, ticket) {
                callback(err, ticket);
            });
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;
            if (!_.isUndefined(results.types)) self.content.data.ticketTypes = results.types;
            if (!_.isUndefined(results.ticket)) self.content.data.ticket = results.ticket;

            res.render('subviews/editticket', self.content);
        }
    });
};

ticketsController.submitTicket = function(req, res, next) {
    var marked = require('marked');
    var Ticket = ticketSchema;
    var tags = [];
    var result = {};
    if (!_.isUndefined(req.body.tTags)) {
        var t = _s.clean(req.body.tTags);
        tags = _.compact(t.split(','));
    }

    var HistoryItem = {
        action: 'ticket:created',
        description: 'Ticket was created.'
    };

    if (_.isUndefined(req.body.tIssue) ||
        _.isNull(req.body.tIssue) ||
        _.isEmpty(req.body.tIssue) ||
        _.isUndefined(req.body.tSubject) ||
        _.isNull(req.body.tSubject) ||
        _.isEmpty(req.body.tSubject)) {

        result.error = "Please fill out all fields.";
        result.success = false;
        return res.json(result);
    }

    Ticket.create({
        owner: req.user._id,
        group: req.body.tGroup,
        status: 0,
        tags: tags,
        date: new Date(),
        subject: req.body.tSubject,
        issue: marked(req.body.tIssue),
        priority: req.body.tPriority,
        type: req.body.tType,
        history: [HistoryItem]

    }, function(err, t) {
        if (err) {
            winston.warn(err);
            result.error = err.message;
            result.success = false;
            return res.json(result);
        }

        //Trigger Event that a ticket was submitted.
        emitter.emit('ticket:created', t);

        result.ticket = t;
        result.success = true;

        return res.json(result);
    });
};

ticketsController.postcomment = function(req, res, next) {
    var Ticket = ticketSchema;
    var id = req.body.ticketId;
    var comment = req.body.commentReply;
    var User = req.user;
    //TODO: Error check fields

    Ticket.getTicketById(id, function(err, t) {
        if (err) return handleError(res, err);
        var marked = require('marked');
        comment = comment.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
        var Comment = {
            owner: User._id,
            date: new Date(),
            comment: marked(comment)
        };
        t.updated = Date.now();
        t.comments.push(Comment);
        var HistoryItem = {
            action: 'ticket:comment:added',
            description: 'Comment was added',
            owner: User._id
        };
        t.history.push(HistoryItem);

        t.save(function (err, tt) {
            if (err) handleError(res, err);

            emitter.emit('ticket:comment:added', tt, Comment);
            return res.send(tt);
        });
    });
};

ticketsController.uploadAttachment = function(req, res, next) {
    var fs = require('fs');
    var Busboy = require('busboy');
    var busboy = new Busboy({headers: req.headers });

    var ticketId = req.body.ticketId;
    var ownerId = req.body.ownerId;

    //if (_.isUndefined(ticketId) || _.isUndefined(ownerId))
    //    return res.status(500).send('Invalid IDs');

    var savePath = path.join(__dirname, '../../public/uploads/tickets');
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        console.log('Field [' + fieldname + ']: value: ' + val);
    });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        winston.debug(filename);
        winston.warn(fieldname);
    });
    busboy.on('finish', function() {
        console.log('Done!');

        return res.status(200).send();
    });
    req.pipe(busboy);

    //ticketSchema.getTicketById(ticketId, function(err, ticket) {
    //    if (err) throw err;
    //
    //    var filename = req.files['ticket_' + ticket.uid + '_attachment'];
    //    var path = filename.path;
    //    var attachment = {
    //        owner: ownerId,
    //        name: filename.name.replace('ticket_' + ticket.uid + '_attachment_', ''),
    //        path: '/uploads/tickets/' + filename.name,
    //        type: filename.extension
    //    };
    //    ticket.attachments.push(attachment);
    //
    //    var historyItem = {
    //        action: 'ticket:added:attachment',
    //        description: 'Attachment ' + filename.name + ' was Added',
    //        owner: ownerId
    //    };
    //    ticket.history.push(historyItem);
    //
    //    ticket.updated = Date.now();
    //
    //    ticket.save(function(err, t) {
    //        if (err) {
    //            fs.unlinkSync(path);
    //            return handleError(res, err);
    //        }
    //
    //        return res.json(t);
    //    });
    //});
};

function handleError(res, err) {
    if (err) {
        winston.warn(err);
        if (!err.status) res.status = 500;
        else res.status = err.status;
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = ticketsController;