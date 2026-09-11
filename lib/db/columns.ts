/** Explicit PostgREST column lists — never select('*') on these tables. */

export const ACADEMIC_YEAR_COLUMNS =
  'id, year_name, start_date, end_date, is_current, auto_promotion_enabled, auto_promotion_date, created_at, updated_at'

export const QUESTION_BANK_COLUMNS =
  'id, school_id, question_text, question_type, subject, grade_level, chapter, topic, difficulty, options, correct_answer, correct_answers, matching_pairs, points, explanation, hint, image_url, attachments, tags, usage_count, is_verified, is_active, created_by, created_at, updated_at'

export const SURVEY_COLUMNS =
  'id, school_id, title, description, survey_type, target_audience, start_date, end_date, status, is_anonymous, allow_multiple_responses, show_results_to_respondents, total_responses, created_by, created_at, updated_at'

export const SURVEY_QUESTION_COLUMNS =
  'id, survey_id, question_text, question_order, question_type, options, is_required, min_value, max_value, created_at'

export const LOTTERY_SETTING_COLUMNS =
  'id, school_id, is_enabled, registration_start, registration_end, lottery_time, target_grade, academic_year, max_choices, allow_edit_until_end, notify_parents_result, status, total_registrations, successful_assignments, failed_assignments, executed_at, executed_by, created_at, updated_at'

export const CLASS_COLUMNS =
  'id, school_id, name, grade, section, teacher_id, teacher_name, total_capacity, admin_reserved, available_capacity, current_count, academic_year, is_active, description, room_number, created_at, updated_at'

export const VIRTUAL_CLASS_COLUMNS =
  'id, school_id, class_id, teacher_id, title, skyroom_room_id, skyroom_room_name, status, created_by, created_at, updated_at'

export const VIRTUAL_CLASS_SESSION_COLUMNS =
  'id, virtual_class_id, starts_at, ends_at, status, join_buffer_minutes, created_at, updated_at'

export const SUBSCRIPTION_PLAN_COLUMNS =
  'id, name, display_name, price_monthly, price_yearly, is_active, sort_order, features, created_at'

export const FILE_COLUMNS =
  'id, user_id, school_id, file_type, file_path, file_url, file_size, mime_type, original_name, description, tags, is_public, created_at'

export const EXAM_SESSION_COLUMNS =
  'id, exam_id, student_id, status, started_at, submitted_at, score, total_score, max_score, percentage, passed, rank, graded_at, created_at'

export const EXAM_ANSWER_COLUMNS =
  'id, exam_id, student_id, question_id, answer_option, answer_text, is_correct, points_earned, max_points'

export const EXAM_QUESTION_COLUMNS =
  'id, exam_id, question_bank_id, question_text, question_type, question_order, options, correct_answer, correct_answers, matching_pairs, points, explanation, hint, image_url, difficulty, topic, chapter'

export const TRANSFER_REQUEST_COLUMNS =
  'id, student_id, from_school_id, from_grade, to_school_id, to_grade, status, requested_by, request_reason, approved_by, approved_at, rejection_reason, transfer_all_data, data_transferred, transferred_at, created_at'

export const ACTIVATION_CODE_COLUMNS =
  'id, code, code_hash, school_id, student_id, target_role, relation_type, target_name, target_phone, target_email, expires_at, max_attempts, attempt_count, status, used_at, used_by, bound_phone, issued_by, created_at, updated_at'

export const DAILY_ACTIVITY_COLUMNS =
  'id, user_id, activity_date, is_active, last_activity_at, xp_earned_today, stories_created, problems_solved, study_buddy_messages, ai_analyses'

export const AI_MODEL_CONFIG_COLUMNS =
  'capability_key, capability_name, capability_description, is_active, tier1_gemini_model, tier2_gemini_model, tier3_free_model, tier4_free_model, tier5_cheap_model, tier6_premium_model, tier5_enabled, tier6_enabled, temperature, max_tokens, total_requests, cache_hits, total_tokens_saved, tier1_usage, tier2_usage, tier3_usage, total_errors'

export const USER_AI_LIMIT_COLUMNS =
  'user_id, daily_count, daily_limit, total_requests, total_cached'

export const GEMINI_KEY_COLUMNS = 'id, daily_count, daily_limit, is_active, last_used_at'

export const AI_MODEL_SETTINGS_COLUMNS =
  'feature_name, feature_title, tier_a_model, tier_b_model, tier_c_model, tier_d_model, tier_e_model, tier_f_model, temperature, max_tokens'

export const AI_GENERAL_SETTINGS_COLUMNS =
  'id, gemini_proxy_url, gemini_api_keys, openrouter_api_key, tier_e_enabled, tier_f_enabled, current_month_spent, current_day_spent, monthly_budget_usd, daily_budget_usd'

export const NOTIFICATION_PREFERENCE_COLUMNS =
  'id, user_id, report_published_enabled, grade_added_enabled, attendance_alert_enabled, homework_due_enabled, homework_graded_enabled, achievement_enabled, badge_earned_enabled, xp_milestone_enabled, system_enabled, announcement_enabled, in_app_enabled, email_enabled, push_enabled, quiet_hours_start, quiet_hours_end'

export const BEHAVIORAL_OBSERVATION_COLUMNS =
  'id, student_id, counseling_record_id, observation_date, observation_time, duration_minutes, setting, observer_id, observer_role, behaviors_observed, behavior_frequency, description, severity, antecedents, consequences, environmental_factors, student_response, intervention_applied, created_at'

export const ATTENDANCE_MONTHLY_STATS_COLUMNS =
  'id, student_id, month, present_days, absent_days, late_days, excused_days'

export const MUSIC_ASSESSMENT_COLUMNS =
  'id, student_id, teacher_id, school_id, assessment_date, semester, academic_year, rhythm_sense, pitch_accuracy, music_reading, listening_skills, vocal_performance, instrument, instrument_proficiency, creativity, expression, participation_score, behavior_score, teacher_notes, achievements, areas_for_improvement, songs_learned, final_grade, created_at, updated_at'

export const ART_ASSESSMENT_COLUMNS =
  'id, student_id, teacher_id, school_id, assessment_date, semester, academic_year, creativity, originality, technical_skills, use_of_color, composition, attention_to_detail, mastered_techniques, notable_projects, participation_score, cleanup_responsibility, respect_for_materials, teacher_notes, strengths, areas_for_growth, exhibitions, awards, final_grade, created_at, updated_at'

export const SPORTS_ASSESSMENT_COLUMNS =
  'id, student_id, teacher_id, school_id, assessment_date, semester, academic_year, cardiovascular_endurance, muscular_strength, muscular_endurance, flexibility, body_composition, coordination, agility, balance, team_sports_skills, individual_sports_skills, game_understanding, sportsmanship, teamwork, leadership, effort, following_rules, specialized_sports, sport_achievements, fitness_test_results, teacher_notes, strengths, areas_for_improvement, competitions_participated, medals_awards, final_grade, created_at, updated_at'

export const STEM_ASSESSMENT_COLUMNS =
  'id, student_id, teacher_id, school_id, assessment_date, semester, academic_year, subject, problem_solving, logical_thinking, computational_thinking, debugging_skills, technical_skills, creativity, innovation, collaboration, communication, completed_projects, programming_languages, concepts_mastered, competitions_participated, rankings, awards, teacher_notes, strengths, next_steps, final_grade, created_at, updated_at'

export const SPECIALTY_ASSESSMENT_COLUMNS: Record<string, string> = {
  music: MUSIC_ASSESSMENT_COLUMNS,
  art: ART_ASSESSMENT_COLUMNS,
  sports: SPORTS_ASSESSMENT_COLUMNS,
  stem: STEM_ASSESSMENT_COLUMNS,
}

export const CLASS_REGISTRATION_COLUMNS =
  'id, student_id, lottery_setting_id, choice_1_class_id, choice_2_class_id, choice_3_class_id, choice_4_class_id, result_class_id, assigned_choice, status, registered_by, registered_at, last_modified_at, assigned_at, admin_note, created_at, updated_at'

export const LOTTERY_LOG_COLUMNS =
  'id, lottery_setting_id, log_type, student_id, class_id, choice_number, message, details, created_at'

export const COUNSELING_RECORD_COLUMNS =
  'id, student_id, school_id, counselor_id, opened_date, closed_date, status, issue_categories, priority_level, summary, initial_assessment, goals, is_referred, referred_to, referral_reason, referral_date, referral_outcome, created_at, updated_at'

export const COUNSELING_SESSION_COLUMNS =
  'id, counseling_record_id, student_id, counselor_id, session_number, session_date, duration_minutes, session_type, attendees, topics_discussed, session_notes, student_mood, student_cooperation, interventions_used, homework, homework_completed, progress_rating, progress_notes, next_session_planned, next_session_date, next_session_goals, created_at'

export const PSYCHOLOGICAL_TEST_COLUMNS =
  'id, student_id, counseling_record_id, test_name, test_type, test_date, administered_by, raw_scores, standard_scores, percentile_ranks, iq_score, interpretation, strengths, weaknesses, recommendations, report_url, created_at'

export const PARENT_CONTACT_COLUMNS =
  'id, student_id, counseling_record_id, counselor_id, contact_date, contact_type, parent_name, parent_relation, purpose, discussion_summary, parent_concerns, agreements_made, action_items, follow_up_needed, follow_up_date, follow_up_note, created_at'

export const FIELD_SELECTION_COLUMNS =
  'id, student_id, first_choice_id, second_choice_id, third_choice_id, final_field_id, status, ai_recommendation, counselor_note, counselor_recommendation, counselor_id, aptitude_test_results, parent_opinion, parent_approved, parent_approved_at, grade7_performance, grade8_performance, grade9_performance, academic_year, created_at, updated_at'

export const AI_ALERT_COLUMNS =
  'id, alert_type, severity, message, details, acknowledged, acknowledged_by, acknowledged_at, created_at'

export const PLATFORM_SETTINGS_COLUMNS = 'key, value, description, updated_by, updated_at'

export const LOTTERY_CAPACITY_SUMMARY_COLUMNS =
  'id, class_name, teacher_name, grade, school_id, school_name, set_capacity, platform_quota, platform_assigned, effective_capacity, lottery_capacity, enrolled_count, remaining_seats, academic_year, period_status'

export const COIN_TRANSACTION_COLUMNS =
  'id, user_id, type, amount, source, reference_id, balance_before, balance_after, description, created_at'

export const PAYMENT_TRANSACTION_COLUMNS =
  'id, subscription_id, school_id, owner_id, amount, currency, gateway, gateway_ref_id, gateway_tracking_code, status, description, metadata, paid_at, created_at'

export const ADMIN_BROADCAST_COLUMNS =
  'id, admin_id, school_id, target_role, target_grade, target_class_id, title, message_text, total_recipients, sent_count, failed_count, status, scheduled_at, started_at, completed_at, created_at'

export const PROGRESSION_HISTORY_COLUMNS =
  'id, student_id, from_grade, to_grade, from_class_id, to_class_id, from_class_name, to_class_name, academic_year, progression_type, status, performance_summary, lottery_details, admin_note, progression_date, created_by, created_at, updated_at'
