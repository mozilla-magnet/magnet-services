ALTER TABLE beacon
DROP CONSTRAINT beacon_channel_name_fkey,
ADD CONSTRAINT beacon_channel_name_fkey
	FOREIGN KEY (channel_name)
	REFERENCES channel(name)
	ON DELETE CASCADE;
