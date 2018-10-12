DROP TABLE IF EXISTS [mtc_admin].[checkPin];
CREATE TABLE  [mtc_admin].[checkPin] (
  [school_id] int not null,
  [pin_id] int not null,
  [check_id] int not null,
  CONSTRAINT [PK_checkPin] PRIMARY KEY CLUSTERED ([school_id], [pin_id] ASC),
  -- ensure a one-to-one mapping between check and checkPin
  CONSTRAINT [IX_checkPin_check_id_unique] UNIQUE([check_id])
);
