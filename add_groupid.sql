"-- Add groupId column to medicine_notifications table
ALTER TABLE medicine_notifications ADD COLUMN group_id VARCHAR(100);

-- Add comment to describe the column
COMMENT ON COLUMN medicine_notifications.group_id IS 'For grouping notifications created together';" 
