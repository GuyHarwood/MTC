INSERT INTO [mtc_admin].[checkResult]
(check_id, payload, createdAt, updatedAt)
SELECT check_id, payload, createdAt, updatedAt
FROM [mtc_admin].[checkResultDuplicates];

