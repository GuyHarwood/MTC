--
-- Find pupils eligible to generate a Familiarisation PIN
--

CREATE VIEW [mtc_admin].[vewPupilsEligibleForFamiliarisationPinGeneration] AS (
        SELECT
                p.id,
                p.foreName,
                p.middleNames,
                p.lastName,
                p.dateOfBirth,
                p.school_id,
                p.urlSlug
         FROM
                [mtc_admin].[pupil] p
                LEFT JOIN [mtc_admin].[pupilAttendance] pa ON (p.id = pa.pupil_id)
                LEFT JOIN [mtc_admin].[attendanceCode] ac ON (pa.attendanceCode_id = ac.id)
                INNER JOIN [mtc_admin].[pupilStatus] ps ON (p.pupilStatus_id = ps.id)
         WHERE
                 -- include all pupils except those who are marked as not taking check because they left school
                (ac.id IS NULL OR ac.code <> 'LEFTT')
         AND    ps.code IN ('UNALLOC',
                            'ALLOC',
                            'LOGGED_IN',
                            'NOT_TAKING_CHECK')


         EXCEPT

         -- Exclude pupils who already have an active familiarisation check
         SELECT
                p.id,
                p.foreName,
                p.middleNames,
                p.lastName,
                p.dateOfBirth,
                p.school_id,
                p.urlSlug
         FROM
                [mtc_admin].[pupil] p
                LEFT JOIN [mtc_admin].[check] AS chk ON (p.id = chk.pupil_id)
                LEFT JOIN [mtc_admin].[checkStatus] AS chkStatus ON (chk.checkStatus_id = chkStatus.id)
         WHERE  chk.isLiveCheck = 0
         AND    chkStatus.code = 'NEW'
);
