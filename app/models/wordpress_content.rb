class WordpressContent < ApplicationRecord
  validates :wordpress_id, presence: true
  validates :wordpress_modified, presence: true
  validates :wordpress_type, presence: true
  validates :wordpress_status, presence: true
  validates :wordpress_content_type, presence: true
end
