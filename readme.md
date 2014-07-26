# Admin Control Panel [![Build Status](https://travis-ci.org/samt/acpjs.png)](https://travis-ci.org/samt/acpjs)

Data-agnostic admin interface generator for CRUD applications

**Note from Sam**:
This idea exists almost totally in concept. There is alpha code being written,
but it's very rudimentary at this point and is not guaranteed to work at all.
I've published to NPM only so that the name is reserved.

## Abstract

The problem with crud apps is they are all are basically the same, yet we find
it necessary to always rewrite the same code over and over. We have a set of
requirements that remain relatively constant:

- Views Types
  - Summary (Dashboard) view of data for graphing or general display
  - Unordered List-view (or table) of items in a collection
  - Ordred list-view (or table) of items in a collection for sorting
  - Log views (uneditable display of entries)
  - Insert/update Item view within a collection
- Functionality
  - View all collections in appropriate view types
  - Validation of data prior to database
    - Deny badly formed data (email addresses must have an "@" sign)
    - Deny duplicate entries (i.e. duplicate username fields)
    - Deny baed upon custom, applicaiton-specific criteria
  - Pagination
  - Filter/Search
  - Form controls in editing views

In addition, we always have data coming in from somewhere. Sometimes it's all
from a database, sometimes it's from flat files, and even sometimes it's from
the network. The problem with other frameworks is they are all dependent (or
completely revolve around) on one type of data retrieval, usually a database.


## Requirements

- node >= 0.8.0
- express >= 4.x.x (if using with existing app)

## Installation

```
npm install acp
```

## Usage

### Basic

```javascript
var acp = require('acp');
var adm = acp();

adm.listen(3000); // identical to express's app.listen()
```

### With an existing express app

Because acp is an express application, we can simply mount it on top of another
application currently being set up. This allows you to write your own custom
user-facing front-end and acp to mange your data behind.

```javascript
var adm = acp();
var app = express();

// ...

app.use('/admin', adm); // mount on "admin"

app.listen(3000); // do not listen with adm
```

### Define Collections

A collection is any set of data that you wish to manage. You can pull it from
your database, flat files, remote systems, etc.

```javascript
var acp = require('acp');
var adm = acp();

var userCollection = adm.define('Users', {
  primaryKey: 'id', // defaults to 'id'
  mount: 'auto', // defaults to 'auto. Mounts CRUD pages on url-safe version of the collection name
  create: createUser,// function(record, cb) , cb(err, record),
  readOne: getOneUser,// function ( primaryKey ),
  read: getUsers, // function( { start: 0, limit: 10 }),
  update: updateUser, // function ( primaryKey, record ),
  delete: deleteUser, // function ( primaryKey | record ), cb(Error err, bool deleted)
  count: countUsers, // function (cb), cb(Error err, number count),
  fields: {
    id: { type: 'auto', primary: true  }, // auto_int sets nice defaults
    slug: { type: 'string', filter: [ ACP.Filter.urlSafe,  },
    name: { type: 'string', validate: function (n) {
      return /[a-z0-9_\-]{4,10}/i.test(n);
    }},
    email: { type: 'string', validate: [ ACP.Validate.email, function (email, next) { // validate can take an array
      db.query('SELECT * FROM users WHERE email = ?', [ email ], function (err, rows) {
        if (err) throw err;
        next( !rows.length );
      });
    }]}
  }
});

adm.listen(3000);
```

### Arbitrary Page

```javascript
var acp = require('acp');
var admin = acp();

// same arguments as .define()
admin.page('Dashboard', {
  mount: '/',
  widgets: [      // table of widgets
    [w1, w2, w3],
    [w4, w5]
  ]
});
```

## API

### Class `ACP`

This is the main class of the Admin Control Panel Interface.

Extends `EventEmiter`

#### `ACP.define(name, options)`

Defines a collection of data to keep track of

- `name` String: Name of the collection, usually pular
- `options` Object:
  - `primaryKey` String: Field name of the primary key.
  - `disableCrud` Boolean: (optional) Disable crud functionality? default:
     false
  - `mount` String: (optional) 'auto' to mount on root with generated slug
     (default), '/routname' otherwise.
  - `orderedBy` String: (optional) Field name to order by if ordered list.
    false or null otherwise. Default: false
  - `create` Function: callback to store a new record.
     Params: `record`, `callback(err, record`)
  - `update` Function: callback to update a record.
    Params: `record`, `callback (err, record)`
  - `readOne` Function: callback to read one record.
    Params: `primaryKey`, `callback(err, record)`
  - `read` Function: callback to get the collection.
    Params: `filter` Array< _ACP.Filter_ >, `callback(err, recs)`
  - `delete` Function callback to delete a record.
    Params: `primaryKey`, `callback(err, deleted?)`
  - `count` Function callback to count all records.
    Params: `Array<ACP.Filter>, callback(err, count)`
  - `fields` Array<ACP.Field>: Field List

#### `ACP.page(name, options)`

- `name` String: Name of the page
- `options` Object:
  - `mount` String: (optional) 'auto' to mount on root with generated slug
    (default), '/routname' otherwise.
  - `widgets` Array< Array<ACP.Widget> >: Widget table. Outer Array: Rows;
    inner Array: Columns

### Class `ACP.Filter`

Plain object.

- `field_name` Object:
  - `eq` Mixed: Returned values must be equal.
  - `ne` Mixed: Returned values must not be equal
  - `gt` Mixed: Returned values must be greater than
  - `lt` Mixed: Returned values must be less than
  - `gte` Mixed: Returned values must be greater than or equals
  - `lte` Mixed: Returns values must be less than or equals

For example:

```javascript
{ email: { ne: 'user@example.com '} }
```

### Class `ACP.Field`

Is just a plain object with the following properties:

- `type` String: 'auto', 'number', 'string', 'text', 'bool', 'datetime', 'date'
- `primary` Boolean: Is primary key? Default: false. Overridden if primaryKey is set in collection
- `editable` Boolean: Can the user edit this field?
- `filter` Function|Array<Function>: Filter (modify values) of the record
- `validate` Function|Array<Function>: Validate a field. performed AFTER filters
- `options` Array<String>|Plain Object: (Optional) if this is a dropdown/radio/checkbox list, any
- `input` Flag: ACP.TEXT, ACP.PASSWORD, ACP.EMAIL, ACP.DROPDOWN,
  ACP.DROPDOWN_MULI, ACP.DATE_PICKER, ACP.DATETIME_PICKER, ACP.RADIO, ACP.CHECKBOX

### Class `ACP.Widget`

Plain object with properties:

- `size` Number: 1-12, grid width. Default: 3
- `template` String: Either a built in template or user-defined custom path
- `read` Function: Callback to read data to populate the widget width
- `title` String: Widget title

### Class `ACP.Filter`

Contains the functions to validate automatically

- `ACP.Filter.urlSafe`: Makes a URL safe string (RFC 3986)
- `ACP.Filter.slug`: Makes the string into a clean URL-safe sting [a-z0-9\-_]
- `ACP.Filter.boolean`: Converts strings from <form>s "1" or "0" into true boolean values
- `ACP.Filter.datetime`: Parses the date to an ISO 8601 compliant string
- `ACP.Filter.jsDate`: Turns field into a JavaScript `Date` object

### Class `ACP.Validate`

Contains the functions to validate automatically

- `ACP.Validate.email`: Validates an email
- `ACP.Validate.url`: Validates a URL
- `ACP.Validate.foreignKey(collectionName)`: Validates that there exists a primary key in the collection
- `ACP.Validate.unique`: Validates that there are no records with the same value in this field

## Concepts

### Data Agnostic

When you create a collection, you specify where the data comes from, how it is
inserted, how it is updated, and what validations need to take place. There are
validation macros you can use for extremely common validations, such as email
addresses, url-safe strings, and checking for duplicates in other models. You
may also specify filters which take data pre-validation and operate on it.

### Reusable interfaces

You don't have to write your own views. You specify where and when you
want things to appear and it just makes it for you.

### Built with express

To make hooking it into your stack easier, it is made to either piggy-back off
of your current express application or you can specify to run it standalone.

### Security

Because this is going to give a user a one-stop-shop for mangling the database,
we wanted to ensure only the people you give access will have access. There are
few layers of security we've added on:

- Specify what session data must be set before access
- Optionally enable "reauth" if the user hasn't been active within a
  specified amount of time
- Session keys in the URL as query vars for additional session validation
- Referrer checking

## License

The MIT License
