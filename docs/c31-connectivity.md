---
title: 'C31. Connectivity'
description: 'Complete English handbook chapter based on the original C31 course.'
sidebar_position: 31
---

# C31. Connectivity

<div className="chapter-kicker">Chapter C31 · Complete course</div>

Connectivity in Oracle means more than just host + port + user + password. For a Data Developer it is important to understand the complete route of a** connection, the difference between **Listener, Service, SID, Instance, CDB and PDB**, listener.ora / tnsnames.ora files and how you diagnose classic errors such as ORA-12541, ORA-12514, ORA-12154 or ORA-17002.

The central idea is:

```
Client
  ↓
Oracle Net / TCP
  ↓
Listener
  ↓
Service
  ↓
Instant
  ↓
CDB / PDB
  ↓
Scheme / Session
```

In Oracle Multitenant, for a developer, most of the time the desired connection is to **the service of an PDB**, not directly to CDB.

---

## 31.1. The mental model of a connection

We assume an Oracle 26ai Free base:

```
Host: 192.168.56.10
Port: 1521
CDB: FREE
PDB: FREEPDB1
Service: FREEPDB1
User: DEV_LAB
```

The client may be:

```
SQL Development
DataGrip
SQLc
SQL * Plus
ODI
Java JDBC
Python
APEX / ORDS
```

The flow is approximately:

```
DataGrip
   |
= = sync, corrected by elderman = = @ elder _ man
   v
Oracle Listener
   |
Search service FREEPDB1
   v
Oracle Instant FREE
   |
   v
PDB FREEPDB1
   |
   v
DEV_LAB session
```

An important concept:

> **Listen. xQ1QX

The list only receives the initial connection and directs it to the appropriate Oracle service.

---

# 31.2. Main Components

You have to differentiate:

Component
♪ ♪ ♪ ♪ ♪
Client
= = sync, corrected by elderman = =
♪ Listener gets the connections ♪
The Host is the server that runs Oracle
♪ Port of Rule 1521 ♪
This is a computer program that allows users to use the software.
* SID * traditional court identifier *
§ Instance = Oracle + SGA memory
Database
= = sync, corrected by elderman = =
= = sync, corrected by elderman = = @ elder _ man
& Schematics / User & User in which you work
* * * *

---

# 31.3. The Oracle Listener

The Listener is a process separate from the database court.

In Linux, you check it with:

```
Isnrctl status
```

or, more useful for troubleshooting:

```
Isnrctl services
```

Example:

```
Connecting to (DESCRIPTION =
(ADDRESS = (PROTOCOL = TCP) (HOST = 0.0.0) (PORT = 1521))

Summary Services...

Service EXCIPIENTS 1 instance (s).
Instance = FREE, status = READY

Service EXCIPIENTS 1 instance (s).
Instance = FREE, status = READY
```

The interpretation is:

```
Listener → active
Port 1521 → listen
FREE → service known
FREEPDB1 → service known
Instant FREE → READY
```

---

# 31.4. lsnrctl status vs lsnrctl services

the status mainly responds to:

> The listener is running on what address?

```
Isnrctl status
```

services also respond to:

> What services does the listener know and which courts can send them to?

```
Isnrctl services
```

For debugging connectivity, services is often more valuable.

---

# 31.5. listener.ora

The list configuration is usually found in:

```
$ORACLE_HOME/network / admin / listener.ora
```

Simplified example:

```
LISTENER =
(DESCRIPTION_LIST =
(DESCRIPTION =
(ADDRESS =
(PROTOCOL = TCP)
(HOST = 0.0.0.0)
(PORT = 1521)
)
)
)
```

Here:

```
HOST = 0.0.0
```

means that the listener listens to all available IPv4 interfaces.

If it were:

```
HOST = locale
```

Remote connections may not work.

---

# 31.6. Service

In modern applications, you usually connect using **Service Name**.

Example:

```
Host: 192.168.56.10
Port: 1521
Service name: FREEPDB1
```

Conceptual:

```
192.168.56.10: 1521 / FREEPDB1
¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶
```

The server is a logical name through which Oracle publishes access to a workshop / database / PDB.

In Multitenant it is very important because PDB-uri are normally accessed through services.

---

# 31.7.SID

SID stands for:

```
System Identifier
```

and traditionally identifies an Oracle court.

For example:

```
SID = FREE
```

In modern Oracle architecture it is important not to think:

```
SID = date
```

as a universal rule.

More useful is:

```
Instant
   ↓
SID

Service
   ↓
logical entry point
```

In a Multitenant environment you can have:

```
Instant: FREE

Services:
FREE
FREEPDB1
APP_PROD
ETL_SERVICE
```

So one court can publish several services.

---

# 31.8. Service Name vs SID

The question may very well arise in the technical discussion.

### SID

Identify a court.

### Service

Identify a logical service offered by Oracle.

Mental model:

```
SID
 ↓
Instant

Service
 ↓
Database workload / PDB
```

For modern applications it is generally recommended to connect by **service name**.

---

# 31.9. Easy Connect

The simplest form of connection is Easy Connect.

Syntax:

```
host: port / service_name
```

Example:

```
192.168.56.10: 1521 / FREEPDB1
```

With SQL\ * Plus:

```
sqlplus dev_lab / password @ 192.168.56.10: 1521 / FREEPDB1
```

or:

```
sqlplus dev_lab @ / 192.168.56.10: 1521 / FREEPDB1
```

Mental scheme:

```
/ / host: port / service
```

---

# 31.10. Example JDBC

For a Java application:

```
jdbc: oracle: thin: @ / / 192.168.56.10: 1521 / FREEPDB1
```

The structure is:

```
jdbc: oracle: thin: @ / / HOST: PORT/SERVICE
```

For example:

```
jdbc: oracle: thin: @ / / localhost: 1521 / FREEPDB1
```

In DataGrip this is about the information built from:

```
Host
Port
Service
User
Password
```

---

# 31.11. tnsnames.ora

Instead of always writing:

```
192.168.56.10: 1521 / FREEPDB1
```

you can create an alias TNS.

Example:

```
DEV26AI =
(DESCRIPTION =
(ADDRESS =
(PROTOCOL = TCP)
(HOST = 192.168.56.10)
(PORT = 1521)
)
(CONNECT_DATA =
(SERVICE_NAME = FREEPDB1)
)
)
```

Then:

```
sqlplus dev_lab / password @ DEV26AI
```

Instead of:

```
sqlplus dev_lab / password @ 192.168.56.10: 1521 / FREEPDB1
```

---

# 31.12. What is the TNS alias

In:

```
DEV26AI =
(...)
```

DEV26AI is neither:

```
database
SID
service
scheme
```

It's just an **aka local**.

The alias is solved by the client using the Oracle Net configuration.

---

# 31.13. Where is tnsnames.ora

Usually:

```
$ORACLE_HOME/network / admin / tnsnames.ora
```

May also be influenced by:

```
TNS_ADMIN
```

for example:

```
TNS_ADMIN export = / eight / oracle / network / admin
```

This is where the classic problems sometimes occur:

```
I've modified the tnsnames.ora,
But the client seems to be ignoring the modification.
```

Possible reason:

```
the customer reads another tnsnames.ora
```

---

# 31.14.

If you write:

```
sqlplus user / password @ DEV26AI
```

The Oracle must transform:

```
DEV26AI
```

in a connection descriptor.

Conceptual:

```
DEV26AI
   ↓
tnsnames.
   ↓
HOST
PORT
SERVICE_NAME
```

If this resolution fails, it often appears:

```
ORA-12154
```

---

# 31.15. What actually happens when you connect

Suppose:

```
sqlplus dev_lab @ / 192.168.56.10: 1521 / FREEPDB1
```

The conceptual steps are:

```
1. The client solves the hostname / IP-

2. Create TCP connection to:
192.168.56.10: 1521

3. The listener accepts the connection

4. The customer shall request:
SERVICE_NAME = FREEPDB1

5. The listener checks if he knows the service.

6. The listener directs the connection

7. Oracle creates / associates a process server

8. Login DEV_LAB User

9. Create Oracle session

10. Session runs in FREEPDB1 container
```

This succession is extremely useful in troubleshooting.

---

# 31.16. How to check where you are connected

After connection:

```
SELECT
SYS_CONTEXT ('USERENV', 'DB_NAME') AS db_name
SYS_CONTEXT ('USERENV', 'DB_UNIQUE_NAME') AS db_unique_name
SYS_CONTEXT ('USERENV', 'SERVICE_NAME') AS service_name
SYS_CONTEXT ('USERENV', 'CON_NAME') AS container_name
SYS_CONTEXT ('USERENV', 'SESSION_USER') AS
FROM dual;
```

You can get about:

```
DB_NAME FREE
SERVICE_NAME FREEPDB1
CON_NAME FREEPDB1
SESSION_USER DEV_LAB
```

Notice the difference:

```
DB_NAME! = SERVICE_NAME
```

This is very important in Multitenant.

---

# 31.17. How to check the current PDB-

Simple:

```
SHOW CON_NAME;
```

for example:

```
CON_NAME
------------------------------
FREEPDB1
```

Or:

```
SELECT SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;
```

---

# 31.18. How do you check the current service

```
SELECT SYS_CONTEXT ('USERENV', 'SERVICE_NAME')
FROM dual;
```

Example:

```
FREEPDB1
```

---

# 31.19. How to check the server

```
SELECT SYS_CONTEXT ('USERENV', 'SERVER_HOST')
FROM dual;
```

Other useful information:

```
SELECT
SYS_CONTEXT ('USERENV', 'HOST') AS client_host
SYS_CONTEXT ('USERENV', 'IP_ADDRESS') AS client_ip
SYS_CONTEXT ('USERENV', 'SERVER_HOST') AS server_host
SYS_CONTEXT ('USERENV', 'SERVICE_NAME') AS
FROM dual;
```

Very useful for debugging in environments with:

```
DEV
TEST
UAT
PROD
```

---

# 31.20. Dynamic Service Registration

In many modern configurations you must not manually define each service in listener.or..

The Oracle court shall be registered at the listener.

Conceptual:

```
Oracle Instant
      |
♪ Register services ♪
      v
Listener
```

That's why you can see in:

```
Isnrctl services
```

services that are not explicitly written in listener.ora.

---

# 31.21. LOCAL\ _ LISTENER

The court must know where the listener is to register its services.

A relevant parameter is:

```
SHOW PARAMETER local_listener;
```

You can force reregistration:

```
ALTER SYSTEM REGISTER;
```

Very useful when:

```
DB is on
The listener is on.
But the listener doesn't see the service yet.
```

---

# 31.22. ORA-12541

Typical message:

```
ORA-12541: TNS: no listener
```

It essentially means:

> The client tries to contact a host / port where he does not find a listener available.

Model:

```
Client
  |
* * *
  v
Host: 1521
X
no listener
```

Possible causes:

```
listener off
wrong port
IP wrong
listener listens to another interface
port forwarding wrong
firewall
container / VM networking
```

First server check:

```
Isnrctl status
```

and on the client:

```
nc-vz 192.168.56.10 1521
```

---

# 31.23. ORA-12514

Example:

```
ORA-12514:
listener does not currently know of service requested
```

Here the situation is different.

The **client has reached the** listener.

But:

```
client → listener: OK
listener → requested service: FAIL
```

For example, you asked:

```
FREEPDB
```

but the real service is:

```
FREEPDB1
```

Check with:

```
Isnrctl services
```

If the service does not appear:

```
ALTER SYSTEM REGISTER;
```

can solve some cases.

---

# 31.24. ORA-12154

Example:

```
ORA-12154:
TNS
```

This problem occurs before you really get to the listener.

For example:

```
sqlplus dev_lab @ MYDATABASE
```

but:

```
MYDATABASE
```

can't be found in the naming configuration.

Model:

```
MYDATABASE
   |
X
name resolution failed
```

Check:

```
tnsnames.
TNS_ADMIN
spelling
Oracle Client Used
```

---

# 31.25. ORA-17002

In JDBC applications you can meet:

```
ORA-17002: I/O
```

It's a more general communication error.

It can occur because of:

```
network
connection reset
listener / network problem
VM networking
firewall
DB connection terminated
invalid network route
timeout
```

Unlike ORA-12514, it does not simply say:

> The service doesn't exist.

The network / JDBC/server context must be investigated.

---

# 31.26. The Four Errors to Memorize

Very good technical discussion scheme:

```
ORA-12154
   ↓
I can't turn the alias into an address.

ORA-12541
   ↓
I have an address, but I can't find the listener.

ORA-12514
   ↓
We've reached the listener,
But the listener doesn't know the servant.

ORA-17002
   ↓
I/O problem / JDBC communication
```

And more compact:

```
12154 = NAME

12541 = LISTENER

12514 = SERVICE

17002 = NETWORK / I/O
```

---

# 31.27. Correct order of troubleshooting

When a connection doesn't work, you don't start directly with SQL.

Follow the connection route:

```
1. Host?
      ↓
2. Network?
      ↓
3. Port?
      ↓
4. Listener?
      ↓
5. Service?
      ↓
6. Instant / PDB?
      ↓
7. Authentication?
      ↓
8. Privileges?
```

This approach saves a lot of time.

---

# 31.28. Level 1 checks the hostel

```
ping 192.168.56.10
```

But attention:

> Ping works doesn't mean Oracle works.

You can have:

```
Ping OK
1521 FAIL
```

---

# 31.29. Level 2 checks port

Linux:

```
nc-vz 192.168.56.10 1521
```

Possible results:

```
Connection succeeded
```

or:

```
Connection refused
```

or:

```
No route to host
```

These messages already separate your networking problems from your Oracle problems.

---

# 31.30. Level 3 checks the list

On the server:

```
Isnrctl status
```

then:

```
Isnrctl services
```

You need to see the job you want.

For example:

```
FREEPDB1 Service
```

---

# 31.31. Level 4 checks PDB-ul

As administrator:

```
SHOW PDBS;
```

Example:

```
CON_ID CON_NAME OPEN MODE
------  ----------  ----------
2 PDB$SEED READ ONLY
3 FREEPDB1 READ WRITE
```

If PDB- is:

```
MOUNTED
```

the application cannot use it normally.

You open it:

```
ALTER PLUGGABLE DATABASE FREEPDB1 OPEN;
```

---

# 31.32. Persistence of PDB Status

After restart, it is useful for the PDB- to automatically reopen.

```
ALTER PLUGGABLE DATABASE FREEPDB1 SAVE STATE;
```

Thus:

```
DB restart
   ↓
FREEPDB1
   ↓
Automatic OPEN
```

---

# 31.33. Level 5 tests authentication

Once you know that:

```
OK network
listener OK
OK service
```

Test:

```
sqlplus dev_lab @ / 192.168.56.10: 1521 / FREEPDB1
```

Now the errors can be from the area:

```
username
password
account locked
authentication
```

for example:

```
ORA-01017
invalid username / password
```

This is already a different category than networking.

---

# 31.34. Connection

It's important that you keep them out of it.

Conceptual:

```
Network connection
        ↓
Oracle session
        ↓
SQL
        ↓
transactions
```

A session may execute:

```
transaction 1
COMMIT

transaction 2
ROLLBACK

transaction 3
COMMIT
```

without reconnecting each time.

---

# 31.35. Verification of Sessions

With appropriate privileges:

```
SELECT
sid,
serial #,
username,
status,
machine,
program,
service_name
FROM v $session
WHERE username IS NOT NULL;
```

You can see for example:

```
USERNAME MACHINE PROGRAM SERVICE_NAME
--------  ------------  -------------  ------------
DEV_LAB ubuntu-host DataGrip FREEPDB1
HR laptop01 SQL Developer FREEPDB1
```

This links Connectivity to the module about **Sessions and Oracle Architecture**.

---

# 31.36. Connection Pool

Enterprise applications do not necessarily open up a new physical connection for each query.

They often use:

```
Connection Pool
```

Conceptual:

```
Application
     |
     v
Connection Pool
  /  |  |  \
C1 C2 C3 C4
  \  |  |  /
Oracle
```

Advantages:

```
less overhead
re-use of connections
control over the number of sessions
better performance
```

In Java technologies such as:

```
HikariCP
UCP
application-server pools
```

---

# 31.37. Why don't you want thousands of unnecessary open connections

Every Oracle session consumes resources.

It may involve:

```
server process
PGA
session memory
State cursor
locks
Transaction States
```

So:

```
10 users
```

and:

```
10,000 connections
```

There are two completely different architectural problems.

---

# 31.38. Connectivity in DWH / ETL

In an DWH you can have:

```
Source DB
    |
    v
ODI Agent
    |
    v
Oracle DWH
```

Or:

```
CRM
ERP
Core Banking
Files
APIS
 ↓
ETL / ODI
 ↓
Oracle DWH
```

Connectivity becomes a critical part of ETL-.

If ETL- does not connect:

```
no extract
   ↓
there is no load
   ↓
Fact incomplete tables
   ↓
reports incorrect / outdated
```

---

# 31.39. Real example ODI

Suppose ODI has to load:

```
SOURCE_CORE_BANKING
        ↓
ODI
        ↓
DWH_PROD
```

The configuration for DWH is:

```
HOST:
dwh-prod.internal

Port:
1521

Service:
DWHPRD
```

If someone configures:

```
Service = PROD
```

And the listener only knows:

```
DWHPRD
```

you can receive:

```
ORA-12514
```

Diagnostic flow:

```
network?
   ↓
Port 1521?
   ↓
Lisener?
   ↓
Isnrctl services
   ↓
Does DWHPRD exist?
```

---

# 31.40. Connections DEV / TEST / UAT / PROD

In real projects you'll have something like:

```
DEV
db-dev: 1521 / DWHDEV

TEST
db-test: 1521 / DWHTST

UAT
db-uat: 1521 / DWHUAT

PROD
db-prod: 1521 / DWHPRD
```

A very dangerous mistake is to assume the environment only by the appearance of the application.

It's safer to check:

```
SELECT
SYS_CONTEXT ('USERENV', 'DB_UNIQUE_NAME'),
SYS_CONTEXT ('USERENV', 'SERVICE_NAME'),
SYS_CONTEXT ('USERENV', 'SERVER_HOST'),
SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;
```

Before a sensitive operation.

---

# 31.41. Anti-pattern: If DataGrip does not work, the base is down

Not necessarily.

You can have:

```
DB UP
Listener UP
PDB OPEN
```

but:

```
DataGrip URL wrong
VPN down
Port locked
wrong service
DNS wrong
JDBC timeout
```

It shall be separated:

```
problem client
network problem
listener problem
database problem
issue
```

---

# 31.42. Diagnosis on layers

A very useful model is the layer model:

```
Application
     ↓
JDBC / Oracle Customer
     ↓
DNS / TNS
     ↓
TCP/IP
     ↓
Listener
     ↓
Service
     ↓
Instant
     ↓
PDB
     ↓
Session
     ↓
SQL
```

When an error occurs, you ask:

> What layer did the connection come to?

For example:

```
ORA-12154
```

is very high:

```
Resolve
```

and:

```
ORA-01017
```

means you've already gone way past the level of networking and you've reached authentication.

---

# 31.43. Full diagnostic example

You have:

```
ORA-12514:
listener does not currently know of service requested
```

Connection string:

```
jdbc: oracle: thin: @ / / 192.168.56.10: 1521 / DEVDB
```

Check:

```
nc-vz 192.168.56.10 1521
```

Result:

```
succeeded
```

So:

```
OK network
OK port
```

Then:

```
Isnrctl services
```

and find:

```
FREEPDB1 Service
```

but not:

```
DEVDB
```

The problem is clear:

```
DEVDB
X

FREEPDB1
♪ ♪
```

You correct the connection string:

```
jdbc: oracle: thin: @ / / 192.168.56.10: 1521 / FREEPDB1
```

---

# 31.44. Example from a VirtualBox environment

For Oracle in an VM:

```
Host Linux
     |
♪ Host-Only ♪
     v
192.168.56.10
     |
     v
Oracle VM
     |
     v
lisener: 1521
```

The client on the host connects:

```
192.168.56.10: 1521 / FREEPDB1
```

All of the following shall work:

```
Host-only interface
        ↓
VM IP
        ↓
firewall
        ↓
port 1521
        ↓
listener
        ↓
FREEPDB1
```

If:

```
ping 192.168.56.10
```

It works, but:

```
nc-vz 192.168.56.10 1521
```

not working, the problem is **after IP level and before connecting the Oracle**.

---

# 31.45. NAT and Port Forwarding

Other variant:

```
Host
127.0.0.1: 1521
     |
= = sync, corrected by elderman = = @ elder _ man
     v
Guest
10.x.x.x: 1521
```

The customer shall use:

```
lochost: 1521 / FREEPDB1
```

and VirtualBox redirects:

```
HOST 1521
     ↓
GUEST 1521
```

A wrong configuration here can produce symptoms similar to an Oracle problem, although the base is perfectly healthy.

---

# 31.46. Listener logs

For more difficult cases you can also investigate the list logs.

There you can see:

```
incoming connections
services required
connection failures
client addresses
TNS errors
```

This becomes particularly useful when:

```
Isnrctl status = OK
```

But the client continues to receive errors.

---

# 31.47. Connectivity and Security

Connectivity and Security are closely linked.

The full flow is:

```
Can I reach the server?
        ↓
Can I reach the listener?
        ↓
Does the service exist?
        ↓
Can I authoticate?
        ↓
What am I authorised to do?
```

I mean:

```
network access
;
authentication
;
authorization
```

That:

```
1521 port is accessible
```

does not mean that you can:

```
SELECT * FROM payroll;
```

---

# 31.48. Connectivity and CDB/PDB

In Multitenant it is essential to ask:

> What container did I connect to?

You can have the same court:

```
FREE
```

but:

```
CDB$ROOT
FREEPDB1
PDB_TEST
PDB_APP
```

That's why you have to check:

```
SHOW CON_NAME;
```

or:

```
SELECT SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;
```

This directly links the **31 Connectivity** module to the **30 CDB / PDB module Oracle Multitenant** module.

---

# 31.49. What an Oracle Data Developer needs to know

You must not necessarily be able to configure RAC, SCAN or Oracle Net Services complex.

But you have to be able to recognize it quickly:

```
connection string
host
port
service
SID
listener
PDB
scheme
session
```

and be able to diagnose:

```
ORA-12154
ORA-12541
ORA-12514
ORA-17002
```

You also need to know the commands:

```
ping
nc
Isnrctl status
Isnrctl services
```

and SQL-:

```
SHOW CON_NAME;

SELECT SYS_CONTEXT ('USERENV', 'SERVICE_NAME')
FROM dual;
```

---

## Questions and answers

### 1. What is Oracle Listener?

The process that receives customer connections and directs them to the appropriate Oracle services.

---

### 2. What is the difference between SID and Service Name?

SID mainly identifies the Oracle court; Service Name is the logical point of access offered to customers and can also represent an PDB.

---

### 3. What does ORA-12541 mean?

The client cannot find the listener on the host and port indicated.

---

### 4. What does ORA-12514 mean?

The client reached the listener, but the listener does not know the requested service.

---

### 5. What does ORA-12154 mean?

The client cannot solve the identity link, for example an alias from tnsnames.or.

---

### 6. How are the tnsnames.ora?

Mapping TNS aliases to login descriptors that typically contain host, port and service name.

---

### 7. What is Easy Connect?

A connection method without the alias TNS, of the form:

```
host: port / service
```

---

### 8. How do you check what services the listener sees?

```
Isnrctl services
```

---

### 9. How do you check what PDB you're connected to?

```
SHOW CON_NAME;
```

or:

```
SELECT SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;
```

---

### 10. What is the route of an Oracle connection?

A very good answer to the technical discussion is:

```
Client
→ Oracle Net
→ Listener
→ Service
→ Instant
→ PDB
→
```

---

# 31.51. Practical exercise in Oracle 26ai

In your laboratory, Oracle 26ai, first identifies the services:

```
Isnrctl services
```

Then connect to PDB.

For example:

```
sqlplus dev_lab @ / 192.168.56.10: 1521 / FREEPDB1
```

After connection:

```
SELECT
SYS_CONTEXT ('USERENV', 'DB_NAME') AS db_name
SYS_CONTEXT ('USERENV', 'SERVICE_NAME') AS service_name
SYS_CONTEXT ('USERENV', 'CON_NAME') AS con_name
SYS_CONTEXT ('USERENV', 'SESSION_USER') AS session_user
SYS_CONTEXT ('USERENV', 'SERVER_HOST') AS
FROM dual;
```

Then intentionally make three mistakes.

Wrong service:

```
192.168.56.10: 1521 / WRONG_SERVICE
```

and observe the error.

Stop the listener in a laboratory environment:

```
♪ ♪ ♪
```

and test the connection again.

Then:

```
Isnrctl start
```

Finally creates an alias in tnsnames.ora:

```
LAB26 =
(DESCRIPTION =
(ADDRESS =
(PROTOCOL = TCP)
(HOST = 192.168.56.10)
(PORT = 1521)
)
(CONNECT_DATA =
(SERVICE_NAME = FREEPDB1)
)
)
```

and tests:

```
sqlplus dev_lab @ LAB26
```

This lab helps you a lot more than just memorizing definitions.

---

# 31.52. Real DWH Scenario

You have an ODI job that fails overnight:

```
ORA-12514
```

You don't start by changing the PL/SQL packager.

The correct reasoning is:

```
ORA-12514
      ↓
the client has reached the listener
      ↓
So host / port probably works
      ↓
The problem is the servant
      ↓
I'll check:
Isnrctl services
      ↓
check PDB
      ↓
check connection topology ODI
```

Suppose after maintenance:

```
DWHPRD PDB = MOUNTED
```

for:

```
READ WRITE
```

The real problem is not the ETL-ul.

It's connectivity infrastructure / database availability.

This type of separation is very important in a role of **Data Developer / ETL Developer / Oracle PL/SQL Developer**.

---

# 31.53. Diagnostic model to memorize

When someone says:

> I can't connect to the Oracle.

always thinks:

```
CLIENT
  ↓
HOST?
  ↓
NETWORK?
  ↓
PORT?
  ↓
LISTENER?
  ↓
SERVICE?
  ↓
INSTANCE?
  ↓
PDB OPEN?
  ↓
USER/PASSWORD?
  ↓
PRIVILEGES?
```

Do not jump directly to:

```
The Oracle is down.
```

---

# 31.54. Final scheme to memorize

```
ORACLE CONNECTIVITY

Client
  │
● Easy Connect / TNS / JDBC
  ▼
HOST
  │
* TCP
  ▼
PORT 1521
  │
  ▼
LISTENER
  │
♪ Service look up ♪
  ▼
SERVICE NAME
  │
  ▼
INSTANCE
  │
  ▼
CDB
  │
  ▼
PDB
  │
  ▼
USER / SCHEMA
  │
  ▼
SESSION
  │
  ▼
SQL / PL/SQL
```

And the main errors are very nicely placed on the same scheme:

```
Alias
  │
− ORA-12154
  ▼
Host / Port
  │
− ORA-12541
  ▼
Listener
  │
− ORA-12514
  ▼
Service
  │
  ▼
Database
  │
  ▼
Authotisation
- ORA-01017
```

## What should remain after the

For **Connectivity**, the most important ideas are:

```
Client → Listener → Service → Instant → PDB → Session
```

and:

```
SID!
Listener!
Connection! = Session! = Transaction
CDB! = PDB
```

And for Troubleshooting:

```
ORA-12154 = not solving the identity link
ORA-12541 = cannot find the listener
ORA-12514 = the listener does not know the service
ORA-17002 = communication problem / I/O JDBC
```

For the **Oracle Data Developer** profile, if you master this flow and can explain why ping OK does not guarantee that 1521 or Oracle service works, you have the practical level required for most connectivity problems encountered in DWH/ETL projects.

---

## Questions and answers

### How would you briefly explain Connectivity to a colleague who knows SQL, but not this area?

Connectivity covers client-to-list-service flow, listener, service name, SID and instance, Easy Connect, TNS alises and JDBC URLs. In practice, first determine what data enter and what result to achieve, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Connectivity?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Connectivity, explicitly follow client-to-listener@-@ to-service flow, listener, service name, SID and instance, Easy Connect, TNS allies and JDBC URLs and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

ODI connects to the CDB root instead of FREEPDB1.
