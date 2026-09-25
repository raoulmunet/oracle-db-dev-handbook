---
title: 'C38. Banking Data Concepts'
description: 'Complete English handbook chapter based on the original C38 course.'
sidebar_position: 38
---

# C38. Banking Data Concepts

<div className="chapter-kicker">Chapter C38 · Complete course</div>

## 38. Banking Data Concesses

This chapter links the concepts of **Oracle, SQL, PL/SQL, ETL and DWH** to the data models found in banks. For a **Oracle Data Developer / DWH Developer**, it is important to understand not only the tables, but also **the business significance of** data: client, account, contract, balance, transaction, interest, exposure, limits, reconciliation and reporting.

---

# 1. The basic conceptual model of a bank

A simplified model can be seen as follows:

```
CUSTOMER
   |
+ ---- CUSTOMER_ACCOUNT ---- ACCOUNT ---- TRANSACTION
   |                              |
-- BALANCE
   |
+ ---- CUSTOMER_CONTRACT ---- CONTRACT ---- PRODUCT
                                      |
+ ---- LOAN
+ ---- DEPOSIT
+ ---- CARD
```

The most important entities are:

- **Customer / Party**
- **Account**
- **Contract
- **Product**
- **Transaction**
- **Balance**
- **Currency**
- **Loan /** Deposit
- **Card**
- **Payment**
- **Collateral**
- **Expose**

In real systems, relationships are much more complex.

---

# 2. Customer vs. Party

The term "banking" frequently appears:

```
PARTY
```

instead of simply:

```
CUSTOMER
```

The reason is that a person or company can exist in the system without necessarily being an active customer.

Example:

```
PARTY
-----
party_id
party_type
name
country
tax_id
stasis
```

The party\ _ type may be:

```
INDIVIDUAL
COMPANY
BANK
GOVERNMENT
INTERNAL_ENTITY
```

A customer can be modeled as follows:

```
CUSTOMER
--------
customer_id
party_id
customer_since
customer_status
segment
```

Conceptual:

```
PARTY
  |
+ -- CUSTOMER
```

---

# 3. CIF - Customer Information File

In many banking systems you will meet:

```
CIF
```

I mean:

> Customer Information File

It's the client's central identifier.

Example:

```
customer_id = 123456
cif = 'C000123456'
```

The same client may have:

```
1 CIF
  |
+ -- Current account
+ -- card
+ -- credit
+ -- deposit
+ -- EUR account
```

CIF- is very important in:

- Customer 360
- AML
- KYC
- CRM
- DWH
- Regulatory reporting.

---

# 4.KYC

KYC means:

```
Know Your Customer
```

The bank needs to know who the client is.

Typical data:

```
CUSTOMER_KYC
------------
customer_id
document_type
document_number
country
residence_country
occupatione
source_of_funds
risk_category
kyc_date
next_review_date
```

Example:

```
customer_id 1001
risk_category MEDIUM
kyc_date 2026-01-15
next_review 2027-01-15
```

In DWH it is very important to preserve history.

For example:

```
CUSTOMER_RISK
```

may be implemented as:

```
SCD Type 2
```

to see:

```
LOW → MEDIUM → HIGH
```

In time.

---

# 5. Account

The account is one of the most important entities.

Example:

```
ACCOUNT
-------
account_id
account_number
iban
customer_id
product_id
current
open_date
close_date
stasis
```

Examples of accounts:

```
CURRENT ACCOUNT
SAVINGS ACCOUNT
LOAN ACCOUNT
DEPOSIT ACCOUNT
CARD ACCOUNT
INTERNAL ACCOUNT
```

Example:

```
IBAN: RO49AAAA1B31007593840000
current: RON
status: ACTIVE
```

---

# 6. Account vs Contract

This difference is very important.

One:

```
CONTRACT
```

is the legal / commercial relationship.

One:

```
ACCOUNT
```

is an accounting or operational container.

Credit example:

```
LOAN CONTRACT
      |
+ -- main account
+ -- interest account
+ -- penalty account
+ -- fee account
```

So:

```
1 contract
```

may generate:

```
N accounts
```

---

# 7. Banking Product

The product describes what the customer bought.

Examples:

```
Current Account
Mortgage Loan
Consumer Loan
Credit Card
Term Deposit
Savings Account
```

Model:

```
PRODUCT
-------
product_id
product_code
product_type
product_name
current
interest_type
```

Example:

```
product_code = MORT_RON_FIX
product_type = LOAN
```

---

# 8. Transaction

The transaction is a financial event.

Example:

```
TRANSACTION
-----------
transaction_id
account_id
transaction_date
value_date
% 1
current
transaction_type
stasis
counterparty
```

Examples:

```
PAYMENT
TRANSFER
ATM_WITHDRAWAL
CARD_PAYMENT
INTEREST
FEE
REVERSAL
```

---

# 9. Booking Data vs Value Data

A very important difference in banking.

We often have:

```
booking_date
value_date
transaction_date
```

Example:

```
transaction_date = 10-MAR
booking_date = 10-MAR
value_date = 11-MAR
```

### Booking Data

The time when the operation is recorded as an accountant.

### Value

The date from which the amount produces financial effect.

For example:

```
interest calculation
```

can use value _ data, not booking _ data.

---

# 10. Debit and Credit

From an accounting perspective:

```
DEBIT
CREDIT
```

does not simply mean:

```
minus / plus
```

Interpretation depends on the type of account.

A simple payment:

```
Customer Account DEBIT 100
Merchant Account CREDIT 100
```

This model allows double-entry accounting:

```
Total Debit = Total Credit
```

---

# 11. Double-entry accounting

Banking systems generally rely on the principle of:

> Each accounting operation shall have at least two postings.

Example:

The client transfers 500 RON.

```
Account A
DEBIT 500

Account B
CREDIT 500
```

In a data model we can have:

```
TRANSACTION
```

and:

```
POSTING
```

Example:

```
TRANSACTION
transaction_id = 10001
```

it produces:

```
POSTING
-------

posting_id transaction_id account_id
1 10001 A DEBIT 500
2 10001 B CREDIT 500
```

---

# 12. Ledger and General Ledger

Two important concepts:

```
Subledger
General Ledger - GL
```

The sub-leader shall contain operational details.

Example:

```
loan accounts
card accounts
curator accounts
```

GL contains aggregated accounting.

Example:

```
GL_ACCOUNT
----------
gl_account_id
gl_code
gl_name
```

Operations are mapped:

```
Customer Account
      ↓
Subledger
      ↓
GL
```

---

# 13. Balance

For an account there may be several types of balance.

For example:

```
BOOK_BALANCE
AVAILABLE_BALANCE
LEDGER_BALANCE
BLOCKED_AMOUNT
```

Example:

```
book_balance = 10,000
blocked_amount = 2,000
available_balance = 8,000
```

Simplified relationship:

```
available_balance
=
book_balance
-
blocked_amount
```

---

# 14. Snapshot Balance

The daily balance is frequently maintained in DWH.

Example:

```
FACT_ACCOUNT_BALANCE
--------------------
account_id
date_id
balance
available_balance
current
```

Data:

```
ACCOUNTQ1QX BALANCE
A100 2026-09-20 10000
A100 2026-09-21 12000
A100 2026-09-22 9500
```

This is usually a:

```
Periodic Snapshot Fact
```

---

# 15. Loan

Concepts such as:

```
main
interest
installation
maturity_date
outstanding_balance
overdue_amount
```

Example:

```
LOAN
----
loan_id
customer_id
contract_id
original_amount
current
interest_rate
start_date
maturity_date
outstanding_principal
```

---

# 16. Principal and Interest

Credit:

```
Loan = Principal + Interest + Fees
```

Example:

```
Main original = 100,000 RON
interest = 20,000 RON
```

The monthly rate may include:

```
main component
+
interest component
+
feet
```

---

# 17. Loan Schedule

The rates are planned in:

```
REPAYMENT_SCHEDULE
```

Example:

```
INSTALLMENT
-----------
loan_id
installment_no
due_date
principal_due
interest_due
fee_due
```

Example:

```
10-OCT
2 - NOV
3).
```

---

# 18. Outstanding

An extremely common term:

```
Outstanding
```

means the amount still due.

Example:

```
original_loan = 100,000
repaid = 30,000
```

then:

```
Outstanding = 70,000
```

In banking you will see frequently:

```
Main Outstanding
```

---

# 19. Past Due / Overdue

If the payment had to be made at:

```
10-SEP
```

but was not paid:

```
past_due_amount
```

becomes 0.

Example:

```
due_date 10-SEP
current_date 23-SEP
past_due 1500
```

---

# 20. DPD = Days Past Due

A very important indicator:

```
DPD
```

I mean:

```
Days Past Due
```

Example:

```
due_date = 01-SEP
Today = 23-SEP
```

The result is approximately:

```
DPD = 22
```

Common categories:

```
0
1
31
61
90 +
```

---

# 21. Exhibition

The exposure is the amount that the bank has exposed to a client or counterparty.

Simplified:

```
Exposals
=
Outstanding Loan
+
Used Credit Limit
+
Other Obligations
```

Example:

```
Mortgage loan 100,000
Credit card 5,000
Overdraft 10,000
```

Exposals approximately:

```
115,000
```

---

# 22. Limit Credit

Products such as:

```
credit card
overdraft
line credit
```

au:

```
credit_limit
used_limit
available_limit
```

Formula:

```
available_limit =
credit_limit - used_limit
```

Example:

```
credit_limit = 20,000
used_limit = 7,500
```

The result is:

```
available_limit = 12,500
```

---

# 23. Collateral

Collateral = loan guarantee.

Examples:

```
property
chariot
deposed
securitisations
guaranty
```

Model:

```
COLLATERAL
----------
collateral_id
type
market_value
current
valuation_date
```

Relationship:

```
LOAN
 |
+ --- LOAN_COLLATERAL
             |
COLLATERAL
```

---

# 24. LTV - Loan To Value

For guaranteed loans:

```
LTV =
Loan Amount / Collateral Value
```

Example:

```
loan = 80,000 EUR
property = 100,000 EUR
```

The result is:

```
LTV = 80%
```

---

# 25. Currency and FX

Banks work multi-currency.

Example:

```
ACCOUNT
Currency = EUR
```

but reporting may be:

```
RON
```

So it has to be done:

```
FX conversion
```

Model:

```
FX_RATE
-------
rate_date
from_currency
to_currency
rates
```

Example SQL:

```
select
T. amount,
T.Currency,
t.amount * fx.rate as amount_ron
from transaction_fact t
Join fx_rate fx
on fx.rate_date = t.transaction_date
and fx.from_currency = t.Currency
and fx.to_currency = 'RON';
```

---

# 26. Exchange rate types

In banking systems there may be:

```
BUY
SELL
MID
ACCOUNTING
REGULATORY
```

rates.

That's why it's not enough:

```
Currency + data
```

It may also be necessary to:

```
rate_type
```

---

# 27. Payment

A payment may contain:

```
sender
Receiver
sender_account
receiver_account
% 1
current
payment_method
payment_status
```

Statuses:

```
INITIATED
AUTHORIZED
PROCESSING
SETTLED
REJECTED
REVERSED
```

---

# 28. Settlement

Settlement represents the financial finalisation of the transaction.

Example:

```
Payment initiated
      ↓
Payment processed
      ↓
Clearing
      ↓
Settlement
```

After setting, the transfer is considered financially completed.

---

# 29. Clearing vs Settlement

### Clearing

Set:

```
who owes who and how much
```

### Settlement

It actually transfers value.

Conceptual:

```
Payment
  ↓
Clearing
  ↓
Settlement
```

---

# 30. Transactions Card

Simplified flow:

```
CARD
 ↓
AUTHORIZATION
 ↓
CAPTURE
 ↓
CLEARING
 ↓
SETTLEMENT
```

A transaction may be:

```
AUTHORIZED
```

but not yet:

```
SETTLED
```

From here there are differences between:

```
available balance
```

and:

```
book balance
```

---

# 31. Authorization and Hold

When you pay by card:

```
authorization
```

can block the amount.

Example:

```
balance = 5000
authorization = 1000
```

then:

```
book balance = 5000
available balance = 4000
```

after setting:

```
book balance = 4000
available balance = 4000
```

---

# 32. Reverse

Some transactions need to be cancelled.

Instead of deleting the transaction:

```
delete from translation;
```

it is often generated:

```
REVERSAL
```

Example:

```
TX1
amount = -100
```

then:

```
TX2
type = REVERSAL
amount = + 100
original_transaction_id = TX1
```

It keeps auditing the trailer.

---

# 33. Status-based processing

In banking, a lot of processes are based on states.

Example:

```
NEW
 ↓
VALIDATED
 ↓
AUTHORIZED
 ↓
POSTED
 ↓
SETTLED
```

Or:

```
REJECTED
CANCELLED
REVERSED
```

From the perspective of SQL/ETL it is essential to understand the correct state to be reported.

---

# 34. EOD - End of Day

A very important concept.

```
EOD
=
End Of Day
```

At the end of the day, the bank runs processes such as:

```
interest calculation
fee calculation
balance calculation
loan aging
GL posting
reconciliation
Regulation reporting
```

Flux:

```
Close business day
      ↓
Process transactions
      ↓
Balances calculated
      ↓
Interest / Fees
      ↓
Accounting posts
      ↓
Reconciliation
      ↓
Open next business day
```

---

# 35. BOD = Beginning of Day

After EOD there may be:

```
BOD
```

I mean:

```
Beginning Of Day
```

that prepares the systems for the next day.

---

# 36. Business Data

Very important in banking:

```
business_date
```

is not necessarily the same as:

```
SYSDATE
```

Example:

```
server time = 00: 15 24-SEP
business_date = 23-SEP
```

because EOD for 23 September is still running.

That's why the bank code must not always assume:

```
TRUNC (SYSDATE)
```

as a data business.

---

# 37. Reconciliation

Reconciliation checks that two systems are consistent.

Example:

```
Core Banking
vs
DWH
```

We can compare:

```
COUNT
SUM (amount)
SUM (balance)
```

Example SQL:

```
select
business_date,
count (*) txn_count,
sum (amount) total_amount
from dwh_transactions
group by business_date;
```

compared to the source.

---

# 38. GL Reconciliation

A very important control:

```
Subledger
vs
General Ledger
```

Example:

```
Loan Subledger = 100,000,000
GL Loan Account = 100.000,000
```

The difference shall be:

```
0
```

---

# 39. Data Linage

For banking reporting you need to be able to explain:

```
Report
  ↓
DWH
  ↓
ETL
  ↓
Staging
  ↓
Core Banking
```

For example:

```
Export Report
```

may come from:

```
CORE.LOAN
CORE.ACCOUNT
CORE.COLLATERAL
CORE.FX_RATE
```

This is:

```
Data Lineage
```

---

# 40. Auditability

In banking systems it is very important to be able to answer:

```
Who?
What?
When?
From where?
Why?
```

Therefore, the tables often have:

```
created_date
created_by
updated_date
updated_by
source_system
batch_id
```

---

# 41. Source System

In an DWH banking there are many source systems.

Example:

```
CORE_BANKING
CARDS
LOANS
CRM
PAYMENTS
AML
TREASURY
INTERNET_BANKING
```

In DWH it often appears:

```
source_system
```

or:

```
source_system_id
```

---

# 42. Golden Record

For a customer there may be data in:

```
CRM
Core Banking
Cards
Loans
```

We need to decide the authority source.

The result may be:

```
Golden Customer Record
```

for example:

```
DIM_CUSTOMER
```

in Enterprise DWH.

---

# 43. Customer 360

Customer 360 tries to provide the complete picture:

```
CUSTOMER
 |
+ -- accounts
+ -- loans
+ -- cards
+ -- payments
+ -- deposits
+ -- products
+ -- risk
```

In DWH it is often built through the integration of several sources.

---

# 44. Banking DWH = Dimensional model

A simplified model:

```
DIM_CUSTOMER
DIM_ACCOUNT
DIM_PRODUCT
DIM_BRANCH
DIM_CURRENCY
DIM_DATE
```

and fact tables:

```
FACT_TRANSACTION
FACT_BALANCE
FACT_LOAN
FACT_PAYMENT
FACT_EXPOSURE
```

Scheme:

```
DIM_CUSTOMER
                  |
DIM_DATE -- FACT_TRANSACTION -- DIM_ACCOUNT
                  |
DIM_PRODUCT
                  |
DIM_CURRENCY
```

---

# 45. Transaction Fact

Example:

```
FACT_TRANSACTION
----------------
transaction_key
account_key
customer_key
product_key
date_key
currency_key
% 1
amount_local
transaction_count
```

The grain must be clearly defined:

> a row = a transaction.

---

# 46. Balance Fact

Other grain:

```
one row =
an account
daily
```

Example:

```
FACT_ACCOUNT_BALANCE
--------------------
account_key
date_key
currency_key
opening_balance
closing_balance
available_balance
```

---

# 47.

Example:

```
FACT_LOAN_SNAPSHOT
------------------
loan_key
customer_key
date_key
outstanding_principal
interest_due
past_due_amount
dpd
```

Grain:

```
1 loan / 1 business day
```

---

# 48. Data Quality in Banking

Examples of rules:

```
account_idQ1QX NULL
Existing customer_id
valid current
numeric amount
Valid value_date
```

Business rules:

```
available_limit = 0
```

or:

```
closing_balance =
opening_balance
+ credits
- debits
```

---

# 49. Example SQL; calculation balance

We assume:

```
ACCOUNT_TRANSACTION
```

with:

```
direction = CREDIT / DEBIT
```

We can calculate:

```
select
account_id,
sum (
houses
when direction = 'CREDIT' then amount
when direction = 'DEBIT' then -amount
end
) as net_amount
from account_transaction
group by account_id;
```

---

# 50. Example SQL - DPD

```
select
loan_id,
due_date,
payment_date,
houses
when payment_date is null
then trunc (sysdate) - due_date
else nausea (payment_date - due_date, 0)
end as dpd
from loan_installment;
```

In a real system you would usually use:

```
business_date
```

instead of SYSDATE.

---

# 51. Example SQL

```
select
customer_id,
sum (outstanding_amount) exposition
from loan
where status = 'ACTIVE'
group by customer_id;
```

With FX:

```
select
l.customer_id,
sum (
l.outstanding_amount * fx.rate
) exposure_ron
from loan l
Join fx_rate fx
on fx.from_currency = l.Currency
and fx.to_currency = 'RON'
and fx.rate_date =: business_date
group by l.customer_id,
```

---

# 52. Example ETL bank

Typical flow:

```
CORE_BANKING
      ↓
STG_ACCOUNT
STG_CUSTOMER
STG_TRANSACTION
      ↓
Data Quality
      ↓
Transformations
      ↓
DIM_CUSTOMER
DIM_ACCOUNT
      ↓
FACT_TRANSACTION
FACT_BALANCE
      ↓
Reconciliation
```

The process can be orchestrated by:

```
ODI
Airflow
Control-M
Autosys
```

or other tools.

---

# 53. Idempotency

In banking, the batches must be able to be resumed without doubling the data.

Wrong:

```
insert into fact_transaction
select *
from staging_transaction;
```

If the bat runs twice:

```
duplicate date
```

Safer:

```
go into fact_transaction
using staging_transaction s
on (f.transaction_id = s.transaction_id)
when matched then
update set f.amount = s.amount
when not matched then
insert (...)
values (...);
```

---

# 54. Late-arriving date

Some transactions may end up in DWH after closing the day.

Example:

```
Transaction Data = 20-SEP
Loaded into DWH = 22-SEP
```

This is:

```
Late-arriving fact
```

ETL- needs to know how to handle this case.

---

# 55. Regulatory reporting

Banks generate numerous reports to:

```
central banks
Regulators
risk departments
finance
```

From the perspective of Data Developer, important are:

```
Traceability
reconciliation
data quality
historical consistency
reproducibility
```

You must be able to reproduce:

```
ratio of 31-DEC-2025
```

even if the client's data have changed subsequently.

Hence the importance:

```
SCD
snapshots
business dates
historical FX rates
```

---

## Questions and answers

It's worth acknowledging right away:

♪ Concept ♪ ♪ Meaning ♪
♪ ♪ ♪ ♪ ♪
= = sync, corrected by elderman = =
* Know Your Customer *
* * * * *
= = = Operational account / accounting account = = =
Contractual relationship
Posting and recording
= = sync, corrected by elderman = = @ elder _ man
♪ Balance ♪ ♪ Balance ♪
The available balance balance available
The remaining amount
* * *
The Bank's exposure
♪ Collateral ♪ ♪ Guarantee ♪
= = sync, corrected by elderman = = @ elder _ man
* * * * * * *
* * * * * * *
Business Data
= = sync, corrected by elderman = =
Reverse Operation
= = sync, corrected by elderman = =
Data Lineage

---

## Questions and answers

### 1. What is the difference between Account and Contract?

The contract is the contractual relationship and the account is the operational / accounting structure associated with it. A contract may have several accounts.

### 2. What is the difference between booking data and value data?

Booking data represents the date of transaction accounting, and value data represents the date from which the transaction produces financial effect.

### 3. What is DPD?

```
Days Past Due
```

Number of days with which a financial obligation has exceeded the payment deadline.

### 4. What is exposure?

The total amount to which the bank is financially exposed for a client or counterparty.

### 5. What is reconciliation?

The process by which data or values in two systems are compared to identify differences.

### 6. Why are data business and not SYSDATE used?

Because the EOD processes can continue after midnight, and the operational day may differ from the calendar date of the server.

### 7. Why is a reverse is preferable to an DELETE?

Because it keeps:

```
Trail audit
historical consistency
Traceability
```

---

# 58. Real script DWH

Suppose the bank has:

```
2 million customers
5 million accounts
100 million transactions / month
```

Every night:

```
00: 00
Core banking closes day

00: 15
Transaction extract

00: 30 a.m.
Load staging

1: 00 a.m.
Load dimensions

1: 30 a.m.
Load facts

2: 00 a.m.
Balance calculations

2.30 p.m.
FX conversion

3: 00 a.m.
Expose calculation

3: 30 a.m.
Reconciliation

4: 00 a.m.
Reports available
```

An Oracle Data Developer must investigate issues such as:

```
Why does 50,000 transactions missing?

Why does GL differ by 1.2M RON?

Why was exposure calculated twice?

Why is yesterday's custodian segment wrong?

Why did EOD finish two hours late?
```

This is where the concepts in the previous chapters intersect:

```
SQL
PL/SQL
ETL
SCD
Partitioning
Execution Plans
Statistics
Batch Processing
Reconciliation
Data Quality
```

---

# 59. Mental Model for Banking Data

for review, you can memorize this structure:

```
CUSTOMER
                     |
CIF/KYC
                     |
CONTRACT
                     |
PRODUCT
                     |
ACCOUNT
                     |
TRANSACTION
                     |
POSTING
                     |
BALANCE
                     |
GL
```

and for loans:

```
CUSTOMER
   ↓
LOAN CONTRACT
   ↓
LOAN ACCOUNT
   ↓
SCHEDULE
   ↓
INSTALLMENTS
   ↓
OUTSTANDING
   ↓
PAST DUE
   ↓
DPD
   ↓
EXPOSURE
   ↓
COLLATERAL
```

---

## What you need to remember

For an **Oracle Data Developer in an** bank, the most important ideas are:

1. **Customer → Contract → Account → Transaction** is the basic conceptual chain.
2. A contract can have several accounts.
3. booking\ _ data, value\ _ data and business\ _ data have different meanings.
4. Financial transactions are usually represented by **debit / credit postings**.
5. The available balance may be different from the accounting balance.
6. For credits you must understand **principal, interest, outstanding, overdue, DPD and** exposture.
7. EOD is critical of banking systems.
8. In DWH banking are essential **snapshots, SCD and** historian.
9. Any important load should be followed by **Data Quality + Reconciliation**.
10. The data shall be **auditable, traceable and reproducible**.
11. Don't assume SYSDATE = banking day.
12. Do not assume that an AUTHORIZED transaction is already SETTLED.
13. Do not simply delete financial events; in many cases **reversals** are used.
14. The source, grain, business and currency of** must be known in any financial report.
15. In a banking DWH, the fundamental question is almost always:

```
I can demonstrate where this value comes from
and can I reconcile the value with the source system?
```

This is one of the most important ways of thinking for an **Oracle / DWH Data Developer in banking**.

---

## Questions and answers

### How would you briefly explain Banking Data Concepts to a colleague who knows SQL, but not this area?

Banking Data Concepts covers custodian, account, product and party concepts, translation, posting data and value data, ledger balance vs available balance. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Banking Data Concepts?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Banking Data Concepts, I explicitly follow the custodian, account, product and party concepts, translation, posting data and value data, ledger balance vs available balance and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Banking Data Concepts appears together with logging, auditing, reconciliation and impact analysis.
