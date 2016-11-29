/* Replace with your SQL commands */

/* Drop constraint on fkey */
ALTER TABLE beacon DROP CONSTRAINT beacon_channel_name_fkey;

/* Drop the pkey constraint, rename and add key on id */
ALTER TABLE channel DROP CONSTRAINT channel_pkey;
ALTER TABLE channel RENAME COLUMN name TO id;
ALTER TABLE channel ADD PRIMARY KEY (id);

/* Add back the fkey constraint */
ALTER TABLE beacon RENAME COLUMN channel_name TO channel_id;
ALTER TABLE beacon
  ADD CONSTRAINT beacon_channel_name_fkey
	FOREIGN KEY (channel_id)
	REFERENCES channel(id)
	ON DELETE CASCADE;

/* add back the name column, and copy data from id */
ALTER TABLE channel ADD COLUMN name TEXT;
UPDATE channel SET name=id;
