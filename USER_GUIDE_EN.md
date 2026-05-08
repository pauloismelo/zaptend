# ZapTend — Complete User Guide

**Version:** 1.0  
**Language:** English  
**Product:** WhatsApp customer service SaaS platform

---

## 1. Welcome

ZapTend is a platform that helps companies serve customers through WhatsApp with an entire team working from the same number, without losing history, context, metrics, or operational control.

With ZapTend, you can:

- Receive and reply to WhatsApp messages in a shared inbox.
- Distribute conversations between agents and departments.
- Add internal notes that customers cannot see.
- Manage contacts, tags, and custom fields.
- Use quick replies.
- Organize opportunities in a kanban pipeline.
- Send broadcast campaigns with approved templates.
- Create automations.
- Use AI features for bot replies, reply suggestions, summaries, intent detection, and sentiment analysis.
- Track metrics through dashboards and reports.
- Manage plan, invoices, and usage.

This guide was written for users who have never used the system before. If you feel lost, start with **First Steps**.

---

## 2. Basic Concepts

### Tenant

A tenant is your company account inside ZapTend. Each company has its own users, contacts, conversations, settings, plan, and data.

Example: if your company is called ACME, it may access the system through an address like:

```text
acme.zaptend.com.br
```

or, in a local/development environment:

```text
http://localhost:3000/acme
```

### User

A user is a person from your team who accesses the system.

Examples:

- Company owner.
- Customer service manager.
- Supervisor.
- Support agent.
- Finance team member.

### Conversation

A conversation is a customer service interaction with a contact through WhatsApp. It has a status, assignee, messages, notes, events, and history.

### Contact

A contact is a person or company that talks to you through WhatsApp. Each contact can have a name, phone number, email, company, tags, and custom fields.

### Agent

An agent is a user who serves customers day to day.

### Department

A department is a customer service group, such as:

- Sales.
- Support.
- Finance.
- Scheduling.
- Customer Success.

### Plan

The plan defines which features and usage limits your company can access.

Main plans:

- Starter.
- Growth.
- Pro.
- Enterprise.

---

## 3. User Roles

### Agent

Usually handles day-to-day customer service.

Can:

- View conversations.
- Reply to customers.
- Use quick replies.
- Create internal notes.
- Update conversation statuses.
- View contact details.

### Supervisor

Monitors the operation and supports agents.

Can:

- Do everything an agent can do.
- Transfer conversations.
- Monitor queues.
- View reports.
- Receive negative sentiment alerts.
- Manage quick replies, depending on configuration.

### Admin

Configures the company operation.

Can:

- Manage the team.
- Manage departments.
- Configure WhatsApp.
- Create automations.
- Manage broadcasts.
- Access billing.
- View reports.

### Owner

The owner is responsible for the account.

Can:

- Do everything an admin can do.
- Change plan.
- Cancel subscription.
- Manage sensitive account data.

### Super Admin

Internal ZapTend role, separate from tenants.

Can:

- View all tenants.
- Activate or suspend tenants.
- View global metrics.
- View usage by tenant.

---

## 4. First Steps

### 4.1 Log In

1. Open your company address.
2. Enter your email and password.
3. Click **Log in**.

If you do not have a password yet:

1. Check if you received an invitation by email.
2. Click the invitation link.
3. Create your password.
4. Return to the login screen.

### 4.2 Create the Company Account

If you are the first user:

1. Open the registration screen.
2. Enter the company details.
3. Create your admin user.
4. Select or confirm the plan.
5. Complete registration.

By default, new companies may have a 14-day trial period, depending on the current commercial rules.

### 4.3 Understand the Main Screen

The tenant area is organized as follows:

- Side menu: quick access to Inbox, Contacts, Pipeline, Broadcasts, Flows, Reports, and Settings.
- Top bar: general information and global actions.
- Main content: changes according to the page you open.

Main areas:

- **Inbox:** daily customer service.
- **Contacts:** contact database and CRM.
- **Pipeline:** opportunities in a kanban board.
- **Broadcasts:** campaigns.
- **Flows/Automations:** automations.
- **Reports:** metrics and performance.
- **Settings:** team, WhatsApp, billing, and preferences.

---

## 5. Recommended Initial Setup

Before serving customers, we recommend following this order.

### Step 1: Configure WhatsApp

You need to connect a WhatsApp Business/API number.

Expected flow:

1. Go to **Settings > WhatsApp**.
2. Click to connect or configure a number.
3. Enter the requested Meta/WhatsApp data.
4. Activate the number.
5. Send a test message to validate receiving.

Important notes:

- The number must be enabled for the official Meta API.
- Access tokens must be treated as sensitive credentials.
- In production, tokens are stored encrypted.

### Step 2: Create Departments

Departments help distribute conversations.

Examples:

- Sales.
- Support.
- Finance.
- Scheduling.

To create a department:

1. Go to **Settings > Departments**.
2. Click **New department**.
3. Enter name, description, and color.
4. Save.

### Step 3: Invite the Team

1. Go to **Settings > Team**.
2. Click **Invite user**.
3. Enter name, email, and role.
4. Select departments, if needed.
5. Send the invitation.

### Step 4: Create Quick Replies

Quick replies save time.

Examples:

- Initial greeting.
- Business hours information.
- Data request.
- Payment link.
- Closing message.

### Step 5: Review Plan and Billing

1. Go to **Settings > Billing**.
2. Check the current plan.
3. Review usage limits.
4. Check invoices.
5. Confirm whether the plan fits your operation.

---

## 6. Inbox

The Inbox is the most important screen for agents.

It usually contains:

- Conversation list on the left.
- Chat in the center.
- Contact details on the right.
- Metrics dashboard at the top.

### 6.1 Inbox Dashboard

At the top of the Inbox, you will see metrics such as:

- Open conversations.
- TMA: average time until assignment or first response, depending on configuration.
- Average CSAT.
- Online agents.
- Volume in the last 24 hours.
- Conversations waiting for assignment.

Use this panel to quickly understand whether the operation is healthy.

### 6.2 Conversation List

The list shows recent conversations.

Each conversation may display:

- Contact name or phone number.
- Last message.
- Status.
- Assignee.
- Department.
- Unread indicator.

### 6.3 Conversation Status

Common statuses:

- **Open:** new conversation or not handled yet.
- **In service:** someone has taken the conversation.
- **Waiting for customer:** the team has replied and is waiting for the customer.
- **Resolved:** service finished.
- **Spam:** conversation marked as irrelevant or abusive.

Best practices:

- Do not leave open conversations without an assignee for too long.
- Use **Waiting for customer** when you have already replied.
- Use **Resolved** only when the case is finished.

### 6.4 Open a Conversation

1. Go to **Inbox**.
2. Click a conversation in the list.
3. Read the history.
4. Check the right-side panel before replying.

### 6.5 Reply to a Message

1. Click the message field.
2. Type your reply.
3. Click send or use the configured shortcut.

Best practices:

- Read the latest messages before replying.
- Check whether there are internal notes.
- Use quick replies, but personalize them when needed.
- Avoid sending sensitive data in plain text.

### 6.6 Attachments

The message field may allow attachments, depending on the supported type.

Common types:

- Image.
- Document.
- Audio.
- Video.

If an attachment fails:

- Check the file size.
- Check the format.
- Try sending it again.
- If the issue persists, contact an admin.

### 6.7 Quick Replies in Chat

To use:

1. Type `/`.
2. Start searching for the reply.
3. Select the option.
4. Review.
5. Send.

Example:

```text
/hello
```

may fill:

```text
Hello! How can I help?
```

### 6.8 Internal Notes

Internal notes help the team keep context.

Examples:

- "Customer asked for a callback tomorrow at 10 AM."
- "I already sent the proposal by email."
- "Sensitive case, talk to supervisor before replying."

Internal notes are not sent to the customer.

### 6.9 Event Timeline

The timeline records events such as:

- Conversation assigned.
- Conversation transferred.
- Status changed.
- Tag added.
- Bot handoff.

Use the timeline to understand what happened before you took over.

### 6.10 Assign a Conversation

If a conversation has no assignee:

1. Open the conversation.
2. Choose the responsible user or department.
3. Confirm.

When to assign:

- When you will handle it.
- When it needs to go to the correct team.
- When a supervisor distributes the queue.

### 6.11 Transfer a Conversation

Transfer when another agent or department should continue.

Always leave a note explaining the reason.

Example:

```text
Customer wants to negotiate an annual contract. Transferring to enterprise sales.
```

### 6.12 Resolve a Conversation

Resolve only when:

- The customer question was answered.
- The purchase was completed.
- The case was closed.
- There is no pending next action.

---

## 7. Contacts and Mini-CRM

### 7.1 What Is a Contact

Every number that talks to your company becomes a contact.

A contact can have:

- Name.
- Phone.
- Email.
- Company.
- Tags.
- Custom fields.
- Conversation history.

### 7.2 Search Contacts

1. Go to **Contacts**.
2. Search by name, phone, or company.
3. Apply filters, if available.

### 7.3 Edit a Contact

1. Open the contact.
2. Click edit.
3. Update the data.
4. Save.

### 7.4 Tags

Tags help with organization and segmentation.

Examples:

- lead.
- customer.
- vip.
- overdue.
- pro-interest.
- urgent-support.

Best practices:

- Use short names.
- Avoid duplicate tags with small variations.
- Agree on naming standards with the team.

### 7.5 Custom Fields

Custom fields store business-specific data.

Examples:

- Tax ID.
- Current plan.
- City.
- Renewal date.
- Interest type.

These fields can be used in segmentation and automations.

### 7.6 Opt-out

Opt-out means the contact does not want to receive mass communications.

If a customer asks to stop receiving messages:

- Mark them as opted out.
- Do not include them in broadcasts.
- Always respect the request.

---

## 8. Pipeline

The Pipeline organizes conversations as opportunities in a kanban board.

### 8.1 What It Is For

Use the Pipeline to:

- Track leads.
- Manage sales.
- Monitor proposals.
- View opportunities by stage.
- Estimate deal value.

### 8.2 Columns

Example columns:

- New.
- Qualified.
- Proposal.
- Won.
- Lost.

### 8.3 Move Cards

1. Go to **Pipeline**.
2. Find the card.
3. Drag it to another column.
4. The conversation stage will be updated.

### 8.4 Estimated Value

Each card can have an estimated value.

Use it to forecast:

- Revenue in negotiation.
- Value by stage.
- Closing potential.

### 8.5 Filters

You can filter by:

- Agent.
- Department.

Use filters for one-on-one meetings or team analysis.

---

## 9. Broadcasts

Broadcasts are campaigns sent to multiple contacts.

### 9.1 Availability by Plan

Broadcasts are available depending on the contracted plan. Usually:

- Starter: unavailable.
- Growth: available with a monthly limit.
- Pro: available with a higher limit.

### 9.2 Important Rules

WhatsApp broadcasts must follow Meta rules:

- Use approved templates.
- Send only to contacts who gave consent.
- Respect opt-out.
- Avoid spam.
- Do not buy lists.

### 9.3 Create a Broadcast

1. Go to **Broadcasts**.
2. Click new broadcast.
3. Enter an internal name.
4. Select a Meta template.
5. Configure template variables.
6. Define the audience.
7. Schedule or start it.

### 9.4 Segmentation

You can segment by:

- Tags.
- Custom fields.
- Opt-out set to false.

Example:

Send only to contacts with tag `lead` and field `plan = pro`.

### 9.5 Track Results

Common metrics:

- Total recipients.
- Sent.
- Delivered.
- Read.
- Failed.

---

## 10. Automations and Flow Builder

Automations execute actions automatically.

### 10.1 Triggers

Available triggers:

- New conversation.
- Keyword.
- Schedule.
- Field changed.

### 10.2 Automation Nodes

Common types:

- Message.
- Condition.
- Delay.
- Assign.
- Tag.
- Webhook.
- End.

### 10.3 Flow Example

```text
New conversation
→ Send welcome message
→ Condition: message contains "price"
→ Add tag "price-interest"
→ Assign to Sales
→ End
```

### 10.4 Best Practices

- Test flows before activating.
- Use short messages.
- Avoid loops.
- Add an explicit end.
- Use tags to record flow decisions.

---

## 11. AI in ZapTend

### 11.1 Automatic Bot

The bot replies automatically when configured and active.

It can:

- Answer common questions.
- Collect initial information.
- Forward to a human when needed.

When the bot identifies that a human is needed, a handoff occurs.

### 11.2 Human Handoff

Handoff happens when:

- The customer asks for a human.
- AI understands it should not continue.
- The message requires care.

After that, the conversation should be taken by an agent.

### 11.3 Mood AI

Mood AI analyzes the sentiment of inbound messages.

Classifications:

- positive.
- neutral.
- negative.
- urgent.

If there are multiple negative or urgent messages in a row, supervisors may receive an alert.

### 11.4 AI Co-Pilot

Co-Pilot helps agents.

Features:

- Suggest reply.
- Summarize conversation.
- Detect intent.

### 11.5 Suggest Reply

In the message field:

1. Click **Suggest reply**.
2. AI fills the text.
3. Review before sending.

Important: never send an AI suggestion without reading it.

### 11.6 Summarize Conversation

In the side panel:

1. Click **Summarize**.
2. Read the 3 bullets.
3. Use them to quickly understand context.

### 11.7 Detect Intent

AI can classify intent as:

- support.
- purchase.
- cancellation.
- complaint.
- question.

Use this to decide the next step.

---

## 12. Reports and Dashboard

### 12.1 Inbox Dashboard

Shows the operation in real time.

Main metrics:

- Open conversations.
- TMA.
- CSAT.
- Online agents.
- Volume in the last 24 hours.
- Unassigned conversations.

### 12.2 Reports Page

Open **Reports** in the side menu.

You will find:

- Period filters.
- Volume by day, week, or month.
- Agent performance.
- Heatmap by weekday and hour.

### 12.3 How to Interpret Metrics

**Open conversations:** current team workload.

**TMA:** how long it takes for a conversation to be assigned or answered.

**TMR:** how long it takes to resolve.

**CSAT:** customer satisfaction, when available.

**Online agents:** team currently available.

**Heatmap:** peak times.

### 12.4 How to Use Reports in Meetings

Suggested weekly routine:

1. Check total volume.
2. Check peak times.
3. Compare agent performance.
4. Identify bottlenecks.
5. Adjust schedules and automations.

---

## 13. Billing, Plans, and Usage

### 13.1 Access Billing

1. Go to **Settings > Billing**.
2. View current plan.
3. Check renewal date.
4. View monthly usage.
5. Review invoices.

### 13.2 Plans

General summary:

| Plan | Best for | Features |
|---|---|---|
| Starter | Small teams | Basic customer service |
| Growth | Growing operations | Broadcasts, automations, and basic AI |
| Pro | Advanced operations | Higher limits, API, and full AI |
| Enterprise | Large operations | Custom terms |

### 13.3 Monthly Usage

The system can track:

- Conversations.
- Broadcasts.
- AI requests.

If you are close to the limit, consider upgrading.

### 13.4 Upgrade

1. Go to Billing.
2. Click the desired plan.
3. You will be redirected to checkout.
4. After payment, the plan is updated.

### 13.5 Cancellation

1. Go to Billing.
2. Click cancel subscription.
3. Confirm.

Usually, access remains active until the end of the already paid period, depending on commercial rules.

---

## 14. Super Admin

This section is for the internal ZapTend team.

### 14.1 Access

Super Admin is separate from tenants and restricted to `@zaptend.com.br` emails.

### 14.2 Tenant Management

Allows:

- List tenants.
- Filter by name, slug, email, and status.
- View details.
- View usage.
- View subscription.
- Activate or suspend tenant.

### 14.3 Global Metrics

Indicators:

- Total MRR.
- Active tenants.
- Total tenants.
- Growth in the last 30 days.

### 14.4 Suspend Tenant

Use suspension when there is:

- Payment failure.
- Abuse.
- Commercial request.
- Security risk.

Always record the reason in the internal support system.

---

## 15. Permissions and Access

### 15.1 I Cannot See a Page

Possible reasons:

- Your role does not have permission.
- Your plan does not include the feature.
- Your session expired.
- The tenant is suspended.

What to do:

1. Try logging out and back in.
2. Check with your company admin.
3. Confirm the plan in Billing.
4. Contact support.

### 15.2 Premium Features

Some features depend on the plan:

- Broadcasts.
- Flow Builder.
- AI Co-Pilot.
- API Access.

If you see a permission error, it may be a plan limitation.

---

## 16. Customer Service Best Practices

### 16.1 Before Replying

- Read the history.
- Check internal notes.
- Check tags.
- Check whether there is already an assignee.
- Check whether the conversation has a sentiment alert.

### 16.2 During Service

- Be clear and objective.
- Use the customer name when possible.
- Avoid overly long messages.
- Use quick replies as a base, not as blind automatic text.
- Record context in internal notes.

### 16.3 When Transferring

Always explain internally:

- Why you are transferring.
- What the customer wants.
- What the last action was.
- What remains to be resolved.

### 16.4 When Closing

Before resolving:

- Confirm there is no pending question.
- Check whether any promise was recorded.
- Use a closing tag, if your operation uses tags.

---

## 17. Security and Privacy

### 17.1 Data Care

Do not share:

- Passwords.
- Tokens.
- Bank details.
- Sensitive documents unless necessary.
- Screenshots with customer data in unauthorized channels.

### 17.2 LGPD

Treat personal data carefully.

Best practices:

- Collect only what is necessary.
- Do not keep outdated data.
- Respect deletion requests.
- Respect opt-out.

### 17.3 Login

Care:

- Use a strong password.
- Do not share user accounts.
- Log out on shared computers.
- Notify an admin if you suspect unauthorized access.

---

## 18. Frequently Asked Questions

### Does ZapTend replace WhatsApp?

No. It uses the official WhatsApp API so your team can provide professional service.

### Can I use the same number on my phone and on the platform?

It depends on the Meta configuration. In general, numbers connected to the official API have their own rules. Check with your admin or support before migrating.

### Why cannot I send a message to a customer?

Possible reasons:

- 24-hour window expired.
- Number has no opt-in.
- Template is required.
- WhatsApp configuration failed.
- Conversation is resolved or marked as spam.

### What is the 24-hour window?

It is a WhatsApp rule: after the customer sends a message, you can reply freely within 24 hours. After that, you usually need to use an approved template.

### Can the customer see my internal notes?

No. Internal notes are visible only to the team.

### Does the customer know I am using AI?

It depends on your company policy. We recommend transparency when the bot is serving automatically.

### Can I edit an AI-suggested reply?

Yes. The suggestion fills the text field; the agent should review and can edit before sending.

### What happens when the bot requests handoff?

The conversation is forwarded to human service or marked to be taken by the team.

### Why did a supervisor receive an alert?

Because the conversation had a sequence of messages with negative or urgent sentiment.

### What does CSAT mean?

CSAT is a customer satisfaction metric. It usually comes from a rating sent at the end of service.

### What does TMA mean?

TMA is average handling/assignment time, depending on the configured metric.

### What does TMR mean?

TMR is average resolution time.

### Can I send broadcasts to anyone?

No. Send only to contacts who authorized communication and respect opt-out.

### Why does broadcast require a template?

Because WhatsApp requires approved templates for company-initiated messages outside the service window.

### How do I know my monthly limit?

Go to **Settings > Billing**.

### My plan blocked a feature. What should I do?

Talk to the owner/admin to upgrade or review the plan.

### I deleted, resolved, or changed something by mistake. Can I recover it?

It depends on the action. Talk to an admin or support as soon as possible.

---

## 19. Troubleshooting

### Messages Do Not Appear in the Inbox

Check:

1. Is the WhatsApp number active?
2. Is the webhook configured?
3. Is the tenant active?
4. Is Meta experiencing instability?
5. Are the API and worker online?

### Messages Do Not Send

Check:

1. 24-hour window.
2. Approved template.
3. WhatsApp token.
4. Conversation status.
5. User permission.

### User Cannot Log In

Possible causes:

- Wrong password.
- Expired invitation.
- User disabled.
- Tenant suspended.
- Expired token.

### Dashboard Does Not Load

Try:

1. Reload the page.
2. Check your connection.
3. Log out and back in.
4. Check whether the API is online.

### AI Does Not Reply

Check:

- Is the bot active on the WhatsApp number?
- Is the Anthropic key configured?
- Is the conversation already assigned to a human?
- Does the plan include AI?
- Was there a handoff?

### Broadcast Does Not Start

Check:

- Does the plan allow broadcasts?
- Does the template exist and is it approved?
- Are there eligible contacts?
- Are contacts not opted out?
- Is the queue/worker running?

---

## 20. Recommended Routines

### Agent Routine

Every day:

1. Log in to the system.
2. Check assigned conversations.
3. Reply to pending conversations.
4. Update statuses.
5. Add notes when needed.
6. Resolve completed conversations.

### Supervisor Routine

Every day:

1. Check the Inbox dashboard.
2. Distribute unassigned conversations.
3. Monitor sentiment alerts.
4. Check online agents.
5. Review critical conversations.

Every week:

1. View reports.
2. Analyze agent performance.
3. Adjust scheduling based on heatmap.
4. Review tags and automations.

### Admin Routine

Every week:

1. Check billing and usage.
2. Review active team members.
3. Update quick replies.
4. Review automations.
5. Check WhatsApp health.

---

## 21. Glossary

**Agent:** person who serves customers.  
**Broadcast:** mass sending with a template.  
**CSAT:** customer satisfaction.  
**Flow Builder:** automation builder.  
**Handoff:** transfer from bot to human.  
**Heatmap:** heat map by time/day.  
**Inbox:** customer service center.  
**Opt-out:** customer who does not want to receive campaigns.  
**Pipeline:** kanban of opportunities/conversations.  
**Tenant:** company account.  
**TMA:** average handling/assignment time.  
**TMR:** average resolution time.  
**WABA:** WhatsApp Business Account.

---

## 22. Implementation Checklist

Use this list to confirm your operation is ready.

- [ ] Company registered.
- [ ] Owner created.
- [ ] WhatsApp connected.
- [ ] Test message received.
- [ ] Departments created.
- [ ] Users invited.
- [ ] Responsibilities defined.
- [ ] Quick replies created.
- [ ] Tags standardized.
- [ ] Custom fields defined.
- [ ] Billing reviewed.
- [ ] Bot configured, if applicable.
- [ ] Broadcast tested, if applicable.
- [ ] Automations reviewed, if applicable.
- [ ] Supervisors trained on alerts.
- [ ] Reports validated.

---

## 23. Support

If you need help, have the following information ready:

- Company/tenant name.
- User email.
- Screenshot, if possible.
- Approximate time of the issue.
- Conversation, contact, or broadcast ID, if available.
- Description of what you tried to do.

Suggested channels:

- Support: `suporte@zaptend.com.br`
- Technical: `dev@zaptend.com.br`
- Status: `status.zaptend.com.br`

---

## 24. Quick Training Summary

If you only have 10 minutes to train someone:

1. Show how to log in.
2. Show the Inbox.
3. Show how to open a conversation.
4. Show how to reply.
5. Show quick replies with `/`.
6. Show internal notes.
7. Show how to transfer.
8. Show how to resolve.
9. Explain that AI suggests, but a human reviews.
10. Explain that broadcasts require care and consent.

With this, a new user can already start safely.
