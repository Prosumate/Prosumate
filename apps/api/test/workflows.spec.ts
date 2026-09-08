import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Workflow Automation Engine Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;
  let contactAId: string;

  beforeEach(async () => {
    memoryDb.clear();

    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'workflow-a@agency.com',
        password: 'Password123!',
        firstName: 'Workflow',
        lastName: 'Admin A',
        agencyName: 'Automation Agency A',
        initialLocationName: 'Automation Loc A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    // Create a contact in Location A
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'Dwight',
        lastName: 'Schrute',
        email: 'dwight.schrute@dundermifflin.com',
        phone: '+1-570-555-0199',
      },
    });
    contactAId = contactRes.json().data.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'workflow-b@agency.com',
        password: 'Password123!',
        firstName: 'Workflow',
        lastName: 'Admin B',
        agencyName: 'Automation Agency B',
        initialLocationName: 'Automation Loc B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
  });

  test('Creates multi-step workflow and executes manual test run', async () => {
    // 1. Create Workflow
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'VIP Client Onboarding',
        description: 'Auto SMS, VIP tagging, and onboarding task generation',
        status: 'published',
        trigger: {
          type: 'CONTACT_CREATED',
          config: {},
        },
        steps: [
          {
            name: 'Send Welcome SMS',
            actionType: 'SEND_SMS',
            config: { content: 'Hi {{firstName}}, welcome to our VIP client network!' },
            order: 0,
          },
          {
            name: 'Add VIP Tag',
            actionType: 'ADD_TAG',
            config: { tag: 'VIP Client' },
            order: 1,
          },
          {
            name: 'Create Account Review Task',
            actionType: 'CREATE_TASK',
            config: { taskTitle: 'Schedule VIP Onboarding Review' },
            order: 2,
          },
        ],
      },
    });

    assert.equal(createRes.statusCode, 201);
    const workflow = createRes.json().data;
    assert.equal(workflow.name, 'VIP Client Onboarding');
    assert.equal(workflow.steps.length, 3);

    // 2. Execute Manual Test Run
    const testRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}/test`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { contactId: contactAId },
    });

    assert.equal(testRes.statusCode, 200);
    const execution = testRes.json().data;
    assert.equal(execution.status, 'completed');
    assert.equal(execution.stepsExecuted.length, 3);
    assert.equal(execution.stepsExecuted[0].actionType, 'SEND_SMS');
    assert.equal(execution.stepsExecuted[1].actionType, 'ADD_TAG');
    assert.equal(execution.stepsExecuted[2].actionType, 'CREATE_TASK');

    // 3. Verify Contact has tag and task
    const contactRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${contactAId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    const contactData = contactRes.json().data;
    assert.ok(contactData.tags.includes('VIP Client'));
    assert.ok(contactData.tasks.some((t: any) => t.title === 'Schedule VIP Onboarding Review'));

    // 4. Verify Execution History
    const historyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}/executions`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(historyRes.statusCode, 200);
    assert.equal(historyRes.json().data.length, 1);
  });

  test('Automated event trigger executes workflow on form submission', async () => {
    // 1. Create Form
    const formRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/forms`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Auto-Trigger Lead Form',
        slug: 'auto-trigger-lead',
        fields: [
          { label: 'First Name', type: 'text', required: true },
          { label: 'Email', type: 'email', required: true },
        ],
      },
    });
    const form = formRes.json().data;

    // 2. Create Workflow listening for FORM_SUBMITTED
    const wfRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Auto-Qualify Form Leads',
        status: 'published',
        trigger: {
          type: 'FORM_SUBMITTED',
          config: { formId: form.id },
        },
        steps: [
          {
            name: 'Tag Inbound Lead',
            actionType: 'ADD_TAG',
            config: { tag: 'Auto-Qualified' },
            order: 0,
          },
        ],
      },
    });
    const wf = wfRes.json().data;

    // 3. Submit form publicly
    const submitRes = await app.inject({
      method: 'POST',
      url: `/api/v1/public/forms/${form.slug}/submit`,
      payload: {
        data: {
          'First Name': 'Pam',
          Email: 'pam.beesly@dundermifflin.com',
        },
      },
    });
    assert.equal(submitRes.statusCode, 201);
    const newContactId = submitRes.json().data.contactId;

    // 4. Check that contact automatically received the tag via workflow!
    const verifyContact = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${newContactId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.ok(verifyContact.json().data.tags.includes('Auto-Qualified'));

    // 5. Check workflow execution history recorded run
    const execRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${wf.id}/executions`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(execRes.json().data.length, 1);
    assert.equal(execRes.json().data[0].status, 'completed');
  });

  test('Draft workflow does NOT execute on events', async () => {
    // 1. Create Workflow in draft status
    const wfRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Draft Sequence',
        status: 'draft',
        trigger: {
          type: 'CONTACT_CREATED',
          config: {},
        },
        steps: [
          {
            name: 'Add Draft Tag',
            actionType: 'ADD_TAG',
            config: { tag: 'Should Not Exist' },
            order: 0,
          },
        ],
      },
    });
    const wf = wfRes.json().data;

    // 2. Create new contact
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'Jim',
        lastName: 'Halpert',
        email: 'jim.halpert@dundermifflin.com',
      },
    });
    const contact = contactRes.json().data;

    // 3. Verify tag was NOT added because workflow is draft
    assert.ok(!contact.tags.includes('Should Not Exist'));

    // 4. Verify no execution runs recorded
    const execRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${wf.id}/executions`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(execRes.json().data.length, 0);
  });

  test('Cross-tenant isolation: User B cannot view, modify, or test-run Location A workflows', async () => {
    const wfRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Location A Proprietary Workflow',
        status: 'published',
        trigger: { type: 'CONTACT_CREATED', config: {} },
        steps: [
          {
            name: 'Proprietary Action',
            actionType: 'ADD_TAG',
            config: { tag: 'Proprietary' },
            order: 0,
          },
        ],
      },
    });
    const wfId = wfRes.json().data.id;

    // User B attempts to list Location A workflows
    const crossList = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossList.statusCode, 403);
    assert.equal(crossList.json().error.code, 'FORBIDDEN');

    // User B attempts to test-run Location A workflow
    const crossTest = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows/${wfId}/test`,
      headers: { authorization: `Bearer ${tokenUserB}` },
      payload: { contactId: contactAId },
    });
    assert.equal(crossTest.statusCode, 403);
    assert.equal(crossTest.json().error.code, 'FORBIDDEN');
  });
});
