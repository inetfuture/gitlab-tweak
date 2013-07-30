[TOC]

# Tools

* Every project/repo will use gitlab issue system to manage bugs and issues.

<-- slide -->

# Bug lifecycle

Every bug has two properties: status and priority. A bug can either be in Open status or in Closed status. The priority can be limited in: P1, P2, P3.

## Bug status

* **Open**: Any newly created bug which needs to be assigned to developer to fix
* **Closed**: DEV has fixed this bug and verified pass

## Bug priority

* **P1**: The most critical issue which requires the DEV to fix ASAP. Different project will have different definition for what kind of bug shall be assigned to P1
* **P2**: Normal priority which is less critical than the P1. Different project will have different definition for what kind of bug shall be assigned to P2
* **P3**: DEV can fix P3 bugs based on time constrain. Different project will have different definition for what kind of bug shall be assigned to P3

We will use tag to track the bug priority. If the bug is P1 priority, QA needs to link this bug with one P1 tag.

## Bug workflow 

As the limitation of the gitlab issues system, we don't have any other bug statuses other than open and close. DEV and QA need to coordinate and both confirm to the following workflow:

### Workflow for reporting bug

* QA finds and reports new issues
* QA decide the priority, and link the new issue with P1 tag
* QA assign to DEV directly

### Workflow for acceptting and fixing bug

* DEV reviews all bugs assigned to him
* DEV picks up the highest priority bug and work on the fix
* DEV finishes the code and UT, verifies pass on local environment
* DEV checks in code with comment to include: Fix bug #123
* DEV closes the bug #123 and assigns to creator. And at the same time, DEV need to assign one new tag: fixed to this bug

### Workflow for bug verification and reopen

* QA receives the notification that DEV closed one bug #123
* QA works on the bug verification
* QA reopens the bug if the verification fails with comments about how to reproduce the issue. And at the same time, QA needs to remove the "fixed" tag and assign one new tag to this bug: reopened
* Or, if the bug's verification passes, QA needs to remove the "fixed" tag and assign one new tag: "passed"

## Notes

If any of the bug changes the requirement, related test cases need to be refined.

# Bug priority definitions for each project

## Web project 

### P1 bugs

Any issues found in following feature/pages should be assigned with P1 priority:

Module    | Feature     |
----------| ----------- |
App Management   | xxxx       |
Notification | xxxx     |
Analytics    | xxxxx  |

@Richard.He to work on the definition

### P2 bugs

@Richard.He to work on the definition

### P3 bugs

@Richard.He to work on the definition
