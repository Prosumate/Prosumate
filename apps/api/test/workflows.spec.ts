import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Workflow Automation Engine Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let userAId: string;
  let locationAId: string;
  let locationBId: string;
  let contactAId: string;

  const createWorkflow = async (
    token: string,
    locationId: string,
    overrides: Record<string, unknown> = {}
  ) => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationId}/workflows`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Phase 5 Workflow',
        description: 'Workflow created by the Phase 5+ API test suite',
        status: 'published',
        trigger: { type: 'CONTACT_CREATED', config: { source: 'api-test' } },
        steps: [
          {
            name: 'Create follow-up task',
            actionType: 'CREATE_TASK',
            config: { taskTitle: 'Follow up from Phase 5 test' },
            order: 0,
          },
        ],
        ...overrides,
      },
    });

    assert.equal(response.statusCode, 201, response.body);
    return response.json().data;
  };

  const createFolder = async (
    token: string,
    locationId: string,
    name: string,
    color = '#6366f1',
    icon = 'Folder'
  ) => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationId}/workflow-folders`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name, color, icon },
    });

    assert.equal(response.statusCode, 201, response.body);
    return response.json().data;
  };

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
    userAId = regA.json().data.user.id;
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
    locationBId = regB.json().data.location.id;
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

  test('Workflow folders support CRUD, live counts, moves, and unassign workflows when deleted', async () => {
    const nurtureFolder = await createFolder(
      tokenUserA,
      locationAId,
      'Lead Nurture',
      '#2563eb',
      'Sparkles'
    );
    const salesFolder = await createFolder(
      tokenUserA,
      locationAId,
      'Sales Handoffs',
      '#16a34a',
      'Briefcase'
    );

    assert.equal(nurtureFolder.locationId, locationAId);
    assert.equal(nurtureFolder.workflowCount, 0);
    assert.ok(nurtureFolder.createdAt);
    assert.ok(nurtureFolder.updatedAt);

    const updateFolderRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/workflow-folders/${nurtureFolder.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Qualified Lead Nurture',
        color: '#0ea5e9',
        icon: 'Target',
      },
    });
    assert.equal(updateFolderRes.statusCode, 200, updateFolderRes.body);
    assert.equal(updateFolderRes.json().data.name, 'Qualified Lead Nurture');
    assert.equal(updateFolderRes.json().data.color, '#0ea5e9');
    assert.equal(updateFolderRes.json().data.icon, 'Target');

    const workflow = await createWorkflow(tokenUserA, locationAId, {
      name: 'Tagged Folder Workflow',
      folderId: nurtureFolder.id,
      tags: ['nurture', 'priority'],
    });
    assert.equal(workflow.folderId, nurtureFolder.id);
    assert.deepEqual(workflow.tags, ['nurture', 'priority']);
    assert.equal(workflow.createdBy, userAId);

    const initialListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflow-folders`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(initialListRes.statusCode, 200, initialListRes.body);
    const initialFolders = initialListRes.json().data;
    assert.equal(initialFolders.find((folder: any) => folder.id === nurtureFolder.id).workflowCount, 1);
    assert.equal(initialFolders.find((folder: any) => folder.id === salesFolder.id).workflowCount, 0);

    const moveRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}/move`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { folderId: salesFolder.id },
    });
    assert.equal(moveRes.statusCode, 200, moveRes.body);
    assert.equal(moveRes.json().data.folderId, salesFolder.id);

    const movedListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflow-folders`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    const movedFolders = movedListRes.json().data;
    assert.equal(movedFolders.find((folder: any) => folder.id === nurtureFolder.id).workflowCount, 0);
    assert.equal(movedFolders.find((folder: any) => folder.id === salesFolder.id).workflowCount, 1);

    const deleteFolderRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/locations/${locationAId}/workflow-folders/${salesFolder.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(deleteFolderRes.statusCode, 200, deleteFolderRes.body);
    assert.equal(deleteFolderRes.json().data.deleted, true);
    assert.equal(deleteFolderRes.json().data.id, salesFolder.id);

    const workflowAfterFolderDeleteRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(workflowAfterFolderDeleteRes.statusCode, 200, workflowAfterFolderDeleteRes.body);
    assert.equal(workflowAfterFolderDeleteRes.json().data.folderId, null);
    assert.deepEqual(workflowAfterFolderDeleteRes.json().data.tags, ['nurture', 'priority']);
    assert.equal(workflowAfterFolderDeleteRes.json().data.createdBy, userAId);

    const finalListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflow-folders`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.ok(!finalListRes.json().data.some((folder: any) => folder.id === salesFolder.id));
    assert.ok(finalListRes.json().data.some((folder: any) => folder.id === nurtureFolder.id));
  });

  test('Duplicate creates an independent draft copy with lineage, tags, folder, and new step IDs', async () => {
    const folder = await createFolder(tokenUserA, locationAId, 'Reusable Sequences');
    const original = await createWorkflow(tokenUserA, locationAId, {
      name: 'Original Conversion Sequence',
      description: 'Source workflow that must remain independent from its copy',
      folderId: folder.id,
      tags: ['conversion', 'featured'],
      trigger: {
        type: 'FORM_SUBMITTED',
        config: { formId: 'any', filters: { source: 'website' } },
      },
      steps: [
        {
          name: 'Send welcome email',
          actionType: 'SEND_EMAIL',
          config: {
            templateSubject: 'Welcome',
            templateBody: 'Hello {{firstName}}',
            metadata: { campaign: 'fall-launch' },
          },
          order: 0,
        },
        {
          name: 'Add conversion tag',
          actionType: 'ADD_TAG',
          config: { tag: 'Converted' },
          order: 1,
        },
      ],
    });

    const duplicateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows/${original.id}/duplicate`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { name: 'Conversion Sequence Copy' },
    });
    assert.equal(duplicateRes.statusCode, 201, duplicateRes.body);
    const duplicate = duplicateRes.json().data;

    assert.notEqual(duplicate.id, original.id);
    assert.equal(duplicate.name, 'Conversion Sequence Copy');
    assert.equal(duplicate.status, 'draft');
    assert.equal(duplicate.duplicatedFrom, original.id);
    assert.equal(duplicate.createdBy, userAId);
    assert.equal(duplicate.folderId, folder.id);
    assert.deepEqual(duplicate.tags, original.tags);
    assert.deepEqual(duplicate.trigger, original.trigger);
    assert.equal(duplicate.steps.length, original.steps.length);
    assert.notEqual(duplicate.steps[0].id, original.steps[0].id);
    assert.notEqual(duplicate.steps[1].id, original.steps[1].id);
    assert.deepEqual(duplicate.steps[0].config, original.steps[0].config);

    const storedOriginal = memoryDb.findWorkflowById(original.id);
    const storedDuplicate = memoryDb.findWorkflowById(duplicate.id);
    assert.notStrictEqual(storedDuplicate.tags, storedOriginal.tags);
    assert.notStrictEqual(storedDuplicate.trigger, storedOriginal.trigger);
    assert.notStrictEqual(storedDuplicate.trigger.config, storedOriginal.trigger.config);
    assert.notStrictEqual(storedDuplicate.steps, storedOriginal.steps);
    assert.notStrictEqual(storedDuplicate.steps[0].config, storedOriginal.steps[0].config);
    assert.notStrictEqual(
      storedDuplicate.steps[0].config.metadata,
      storedOriginal.steps[0].config.metadata
    );

    storedOriginal.trigger.config.filters.source = 'partner';
    storedOriginal.steps[0].config.metadata.campaign = 'winter-launch';
    storedOriginal.tags.push('source-only');
    assert.equal(storedDuplicate.trigger.config.filters.source, 'website');
    assert.equal(storedDuplicate.steps[0].config.metadata.campaign, 'fall-launch');
    assert.ok(!storedDuplicate.tags.includes('source-only'));
  });

  test('Deleting a workflow moves it to trash and restoring returns it as a draft', async () => {
    const folder = await createFolder(tokenUserA, locationAId, 'Lifecycle Tests');
    const workflow = await createWorkflow(tokenUserA, locationAId, {
      name: 'Recoverable Workflow',
      folderId: folder.id,
    });

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(deleteRes.statusCode, 200, deleteRes.body);
    assert.equal(deleteRes.json().data.deleted, true);
    assert.equal(deleteRes.json().data.id, workflow.id);
    assert.ok(!Number.isNaN(Date.parse(deleteRes.json().data.deletedAt)));

    const activeListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(activeListRes.statusCode, 200, activeListRes.body);
    assert.ok(!activeListRes.json().data.some((item: any) => item.id === workflow.id));

    const deletedDetailRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(deletedDetailRes.statusCode, 404, deletedDetailRes.body);

    const deletedTestRunRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}/test`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { contactId: contactAId },
    });
    assert.equal(deletedTestRunRes.statusCode, 404, deletedTestRunRes.body);

    const trashRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/trash`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(trashRes.statusCode, 200, trashRes.body);
    const trashedWorkflow = trashRes.json().data.find((item: any) => item.id === workflow.id);
    assert.ok(trashedWorkflow);
    assert.equal(trashedWorkflow.status, 'paused');
    assert.ok(trashedWorkflow.deletedAt);

    const deletedFolderListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflow-folders`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(
      deletedFolderListRes.json().data.find((item: any) => item.id === folder.id).workflowCount,
      0
    );

    const restoreRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}/restore`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(restoreRes.statusCode, 200, restoreRes.body);
    assert.equal(restoreRes.json().data.id, workflow.id);
    assert.equal(restoreRes.json().data.status, 'draft');
    assert.equal(restoreRes.json().data.deletedAt, null);
    assert.equal(restoreRes.json().data.folderId, folder.id);

    const restoredListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.ok(restoredListRes.json().data.some((item: any) => item.id === workflow.id));

    const emptyTrashRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/trash`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.ok(!emptyTrashRes.json().data.some((item: any) => item.id === workflow.id));

    const restoredFolderListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflow-folders`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(
      restoredFolderListRes.json().data.find((item: any) => item.id === folder.id).workflowCount,
      1
    );
  });

  test('Folder and workflow mutations reject cross-location resource IDs and cross-tenant access', async () => {
    const locationBFolder = await createFolder(tokenUserB, locationBId, 'Location B Private Folder');
    const workflowA = await createWorkflow(tokenUserA, locationAId, {
      name: 'Location A Protected Workflow',
    });

    const createWithForeignFolderRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Invalid Foreign Folder Workflow',
        status: 'draft',
        trigger: { type: 'CONTACT_CREATED', config: {} },
        steps: [
          {
            name: 'Create task',
            actionType: 'CREATE_TASK',
            config: { taskTitle: 'Should never be created' },
            order: 0,
          },
        ],
        folderId: locationBFolder.id,
      },
    });
    assert.equal(createWithForeignFolderRes.statusCode, 404, createWithForeignFolderRes.body);

    const moveToForeignFolderRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/workflows/${workflowA.id}/move`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { folderId: locationBFolder.id },
    });
    assert.equal(moveToForeignFolderRes.statusCode, 404, moveToForeignFolderRes.body);

    const updateForeignFolderRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/workflow-folders/${locationBFolder.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { name: 'Illicit Rename' },
    });
    assert.equal(updateForeignFolderRes.statusCode, 404, updateForeignFolderRes.body);

    const unchangedWorkflowRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${workflowA.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(unchangedWorkflowRes.json().data.folderId, null);

    const locationBFoldersRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationBId}/workflow-folders`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    const persistedForeignFolder = locationBFoldersRes.json().data.find(
      (item: any) => item.id === locationBFolder.id
    );
    assert.ok(persistedForeignFolder);
    assert.equal(persistedForeignFolder.name, 'Location B Private Folder');

    const crossTenantFolderListRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflow-folders`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossTenantFolderListRes.statusCode, 403, crossTenantFolderListRes.body);

    const crossTenantDuplicateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows/${workflowA.id}/duplicate`,
      headers: { authorization: `Bearer ${tokenUserB}` },
      payload: {},
    });
    assert.equal(crossTenantDuplicateRes.statusCode, 403, crossTenantDuplicateRes.body);

    const crossTenantTrashRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/trash`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossTenantTrashRes.statusCode, 403, crossTenantTrashRes.body);

    const deleteWorkflowRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/locations/${locationAId}/workflows/${workflowA.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(deleteWorkflowRes.statusCode, 200, deleteWorkflowRes.body);

    const crossTenantRestoreRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows/${workflowA.id}/restore`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossTenantRestoreRes.statusCode, 403, crossTenantRestoreRes.body);
  });

  test('CONTACT_CREATED dispatch respects source trigger configuration', async () => {
    const matchingWorkflow = await createWorkflow(tokenUserA, locationAId, {
      name: 'Facebook Lead Router',
      trigger: { type: 'CONTACT_CREATED', config: { source: 'facebook' } },
      steps: [
        {
          name: 'Tag Facebook lead',
          actionType: 'ADD_TAG',
          config: { tag: 'facebook-lead' },
          order: 0,
        },
      ],
    });
    const nonMatchingWorkflow = await createWorkflow(tokenUserA, locationAId, {
      name: 'Referral Lead Router',
      trigger: { type: 'CONTACT_CREATED', config: { source: 'referral' } },
      steps: [
        {
          name: 'Tag referral lead',
          actionType: 'ADD_TAG',
          config: { tag: 'referral-lead' },
          order: 0,
        },
      ],
    });

    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'Angela',
        lastName: 'Martin',
        email: 'angela.facebook@dundermifflin.com',
        source: 'Facebook Ads',
      },
    });
    assert.equal(contactRes.statusCode, 201, contactRes.body);
    assert.ok(contactRes.json().data.tags.includes('facebook-lead'));
    assert.ok(!contactRes.json().data.tags.includes('referral-lead'));

    const matchingLogsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${matchingWorkflow.id}/executions`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    const nonMatchingLogsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${nonMatchingWorkflow.id}/executions`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(matchingLogsRes.statusCode, 200, matchingLogsRes.body);
    assert.equal(matchingLogsRes.json().data.length, 1);
    assert.equal(matchingLogsRes.json().data[0].contactId, contactRes.json().data.id);
    assert.equal(nonMatchingLogsRes.statusCode, 200, nonMatchingLogsRes.body);
    assert.equal(nonMatchingLogsRes.json().data.length, 0);
  });

  test('APPOINTMENT_BOOKED automatically executes wait, notification, and contact-field actions', async () => {
    const calendarRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Workflow Runtime Calendar',
        slug: 'workflow-runtime-calendar',
        defaultDurationMinutes: 30,
        timezone: 'Africa/Lagos',
        availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
      },
    });
    assert.equal(calendarRes.statusCode, 201, calendarRes.body);
    const calendar = calendarRes.json().data;

    const workflow = await createWorkflow(tokenUserA, locationAId, {
      name: 'Appointment Runtime Actions',
      trigger: { type: 'APPOINTMENT_BOOKED', config: { calendarId: calendar.id } },
      steps: [
        {
          name: 'Wait two hours',
          actionType: 'WAIT_DELAY',
          config: { duration: 2, unit: 'hours' },
          order: 0,
        },
        {
          name: 'Notify account team',
          actionType: 'INTERNAL_NOTIFICATION',
          config: { message: 'Appointment booked for {{firstName}} {{lastName}}' },
          order: 1,
        },
        {
          name: 'Record appointment segment',
          actionType: 'UPDATE_CONTACT_FIELD',
          config: { field: 'appointmentSegment', value: 'priority' },
          order: 2,
        },
      ],
    });

    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const bookingRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars/${calendar.id}/book`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId: contactAId,
        title: 'Automation Strategy Call',
        startTime,
      },
    });
    assert.equal(bookingRes.statusCode, 201, bookingRes.body);

    const executionLogsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/workflows/${workflow.id}/executions`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(executionLogsRes.statusCode, 200, executionLogsRes.body);
    assert.equal(executionLogsRes.json().data.length, 1);
    const execution = executionLogsRes.json().data[0];
    assert.equal(execution.status, 'completed');
    assert.equal(execution.triggerType, 'APPOINTMENT_BOOKED');
    assert.deepEqual(
      execution.stepsExecuted.map((step: any) => step.actionType),
      ['WAIT_DELAY', 'INTERNAL_NOTIFICATION', 'UPDATE_CONTACT_FIELD']
    );
    assert.equal(execution.stepsExecuted[0].output.delayMinutes, 120);
    assert.equal(execution.stepsExecuted[0].output.simulated, true);
    assert.equal(
      execution.stepsExecuted[1].output.notification,
      'Appointment booked for Dwight Schrute'
    );
    assert.equal(execution.stepsExecuted[2].output.field, 'appointmentSegment');
    assert.equal(execution.stepsExecuted[2].output.value, 'priority');

    const contactRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${contactAId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(contactRes.statusCode, 200, contactRes.body);
    assert.equal(contactRes.json().data.customFields.appointmentSegment, 'priority');
    const notification = contactRes.json().data.timeline.find(
      (event: any) => event.type === 'INTERNAL_NOTIFICATION'
    );
    assert.ok(notification);
    assert.equal(notification.description, 'Appointment booked for Dwight Schrute');
    assert.equal(notification.metadata.workflowId, workflow.id);
  });

  test('Workflow creation rejects unsupported action types before persistence', async () => {
    const invalidWorkflowRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/workflows`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Unsupported Action Workflow',
        status: 'published',
        trigger: { type: 'CONTACT_CREATED', config: {} },
        steps: [
          {
            name: 'Run unsupported action',
            actionType: 'DO_SOMETHING_UNKNOWN',
            config: {},
            order: 0,
          },
        ],
      },
    });

    assert.equal(invalidWorkflowRes.statusCode, 400, invalidWorkflowRes.body);
    assert.equal(invalidWorkflowRes.json().error.code, 'VALIDATION_ERROR');
    assert.ok(
      !memoryDb.listWorkflowsByLocation(locationAId).some(
        (workflow: any) => workflow.name === 'Unsupported Action Workflow'
      )
    );
  });
});
