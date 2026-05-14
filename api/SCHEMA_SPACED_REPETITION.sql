-- =====================================================
-- SPACED REPETITION SYSTEM SCHEMA
-- =====================================================
-- Database: PostgreSQL
-- Compatible with: Prisma ORM

-- =====================================================
-- 1. TEST ATTEMPTS TABLE
-- =====================================================
-- Stores individual test attempts with detailed performance metrics
CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    domain_id UUID NOT NULL,
    section_id UUID NOT NULL,
    material_type_id UUID NOT NULL,
    
    -- Performance Metrics
    score_percent DECIMAL(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
    avg_time_per_question DECIMAL(8,2) NOT NULL CHECK (avg_time_per_question >= 0),
    
    -- Timing
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_test_attempts_user_id (user_id),
    INDEX idx_test_attempts_hierarchy (domain_id, section_id, material_type_id),
    INDEX idx_test_attempts_completed_at (completed_at),
    INDEX idx_test_attempts_user_domain (user_id, domain_id),
    
    -- Constraints
    CONSTRAINT fk_test_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_attempts_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_attempts_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_attempts_material FOREIGN KEY (material_type_id) REFERENCES material_types(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. REVIEW STATISTICS TABLE
-- =====================================================
-- Tracks spaced repetition metrics for each hierarchical entity
CREATE TABLE review_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('domain', 'section', 'material')),
    entity_id UUID NOT NULL,
    
    -- Performance Metrics
    avg_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (avg_score >= 0 AND avg_score <= 100),
    weighted_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (weighted_score >= 0 AND weighted_score <= 100),
    
    -- Spaced Repetition Metrics
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
    lapse_count INTEGER NOT NULL DEFAULT 0 CHECK (lapse_count >= 0),
    retention_strength DECIMAL(8,4) NOT NULL DEFAULT 1.0 CHECK (retention_strength >= 0.1 AND retention_strength <= 10.0),
    priority_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
    
    -- Scheduling
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    next_review_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_review_stats_user_entity (user_id, entity_type, entity_id),
    INDEX idx_review_stats_priority (priority_score DESC),
    INDEX idx_review_stats_next_review (next_review_at),
    INDEX idx_review_stats_user_priority (user_id, priority_score DESC),
    
    -- Unique constraint per user/entity
    UNIQUE(user_id, entity_type, entity_id),
    
    -- Constraints
    CONSTRAINT fk_review_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. HIERARCHICAL ENTITIES (Reference Tables)
-- =====================================================
-- These tables should exist in your main schema
-- Included here for completeness

CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_sections_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

CREATE TABLE material_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_material_types_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. VIEWS FOR EFFICIENT QUERIES
-- =====================================================

-- View for user's review stats with next review scheduling
CREATE VIEW user_review_schedule AS
SELECT 
    rs.*,
    CASE 
        WHEN rs.next_review_at IS NULL THEN 'Never Reviewed'
        WHEN rs.next_review_at <= NOW() THEN 'Due Now'
        WHEN rs.next_review_at <= NOW() + INTERVAL '1 day' THEN 'Due Today'
        WHEN rs.next_review_at <= NOW() + INTERVAL '7 days' THEN 'Due This Week'
        ELSE 'Scheduled Future'
    END as review_status,
    EXTRACT(DAYS FROM (rs.next_review_at - NOW())) as days_until_review
FROM review_stats rs
WHERE rs.next_review_at IS NOT NULL;

-- View for user performance trends
CREATE VIEW user_performance_trends AS
SELECT 
    user_id,
    entity_type,
    entity_id,
    AVG(score_percent) as avg_score,
    COUNT(*) as total_attempts,
    MAX(completed_at) as last_attempt,
    MIN(completed_at) as first_attempt,
    CASE 
        WHEN COUNT(*) >= 3 THEN (
            SELECT AVG(score_percent) 
            FROM test_attempts ta2 
            WHERE ta2.user_id = test_attempts.user_id 
            AND ta2.entity_type = test_attempts.entity_type 
            AND ta2.entity_id = test_attempts.entity_id 
            AND ta2.completed_at >= MAX(test_attempts.completed_at) - INTERVAL '30 days'
        )
        ELSE NULL
    END as recent_avg_score
FROM test_attempts
GROUP BY user_id, entity_type, entity_id;

-- =====================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_stats_updated_at 
    BEFORE UPDATE ON review_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. SAMPLE DATA (For Testing)
-- =====================================================

-- Insert sample hierarchy
INSERT INTO domains (id, name, description) VALUES
('domain-networking', 'Networking', 'Computer networking fundamentals'),
('domain-security', 'Security', 'Information security concepts');

INSERT INTO sections (id, domain_id, name, description) VALUES
('section-ip-addressing', 'domain-networking', 'IP Addressing', 'IPv4 and IPv6 addressing'),
('section-subnetting', 'domain-networking', 'Subnetting', 'Network subnetting techniques'),
('section-firewalls', 'domain-security', 'Firewalls', 'Firewall configuration and management');

INSERT INTO material_types (id, section_id, name, description) VALUES
('material-cidr', 'section-ip-addressing', 'CIDR', 'Classless Inter-Domain Routing'),
('material-subnet-masks', 'section-subnetting', 'Subnet Masks', 'Subnet mask calculations'),
('material-vlsm', 'section-subnetting', 'VLSM', 'Variable Length Subnet Masking');

-- =====================================================
-- 7. INDEX OPTIMIZATIONS
-- =====================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_test_attempts_user_hierarchy_score 
    ON test_attempts(user_id, domain_id, section_id, material_type_id, score_percent DESC);

CREATE INDEX idx_review_stats_user_type_priority 
    ON review_stats(user_id, entity_type, priority_score DESC);

-- Partial indexes for better performance
CREATE INDEX idx_review_stats_due_now 
    ON review_stats(user_id, next_review_at) 
    WHERE next_review_at <= NOW();

CREATE INDEX idx_test_attempts_recent 
    ON test_attempts(user_id, completed_at DESC) 
    WHERE completed_at >= NOW() - INTERVAL '30 days';

-- =====================================================
-- 8. CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Ensure test attempts have valid scores
ALTER TABLE test_attempts ADD CONSTRAINT chk_score_range 
    CHECK (score_percent >= 0 AND score_percent <= 100);

-- Ensure review scores are within bounds
ALTER TABLE review_stats ADD CONSTRAINT chk_weighted_score_range 
    CHECK (weighted_score >= 0 AND weighted_score <= 100);

-- Ensure retention strength is reasonable
ALTER TABLE review_stats ADD CONSTRAINT chk_retention_strength_range 
    CHECK (retention_strength >= 0.1 AND retention_strength <= 10.0);

-- =====================================================
-- 9. PRISMA SCHEMA EQUIVALENT
-- =====================================================
/*
model TestAttempt {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  domainId          String    @map("domain_id")
  sectionId         String    @map("section_id")
  materialTypeId    String    @map("material_type_id")
  scorePercent      Float     @map("score_percent") @db.Decimal(5, 2)
  totalQuestions    Int       @map("total_questions")
  correctAnswers    Int       @map("correct_answers")
  avgTimePerQuestion Float    @map("avg_time_per_question") @db.Decimal(8, 2)
  completedAt       DateTime  @map("completed_at") @default(now())
  createdAt         DateTime  @map("created_at") @default(now())

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  domain            Domain    @relation(fields: [domainId], references: [id], onDelete: Cascade)
  section           Section   @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  materialType      Material  @relation(fields: [materialTypeId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([domainId, sectionId, materialTypeId])
  @@index([completedAt])
  @@index([userId, domainId])
  @@map("test_attempts")
}

model ReviewStats {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  entityType          String    @map("entity_type")
  entityId            String    @map("entity_id")
  avgScore            Float     @map("avg_score") @default(0) @db.Decimal(5, 2)
  weightedScore       Float     @map("weighted_score") @default(0) @db.Decimal(5, 2)
  reviewCount         Int       @map("review_count") @default(0)
  streak              Int       @default(0)
  lapseCount          Int       @map("lapse_count") @default(0)
  retentionStrength   Float     @map("retention_strength") @default(1.0) @db.Decimal(8, 4)
  priorityScore       Float     @map("priority_score") @default(0) @db.Decimal(5, 2)
  lastReviewedAt      DateTime? @map("last_reviewed_at")
  nextReviewAt        DateTime? @map("next_review_at")
  createdAt           DateTime  @map("created_at") @default(now())
  updatedAt           DateTime  @map("updated_at") @default(now())

  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, entityType, entityId])
  @@index([userId, entityType, entityId])
  @@index([priorityScore(sort: Desc)])
  @@index([nextReviewAt])
  @@index([userId, priorityScore(sort: Desc)])
  @@map("review_stats")
}
*/
