SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict RlfVbXlGoeuqHhRLpv1oJ6UtQlwx3cIEAKGROaBJ3GhyUOBBy1gbONFpJZhNQyu

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credit_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "name", "category", "price", "unit", "image_url", "bestseller", "rating", "stock", "club_price", "created_at") VALUES
	('11fb1f0a-e744-4e82-a5e2-77a937a0f0e6', 'Royal Basmati Rice (Extra Long)', 'Grains & Rice', 12.5, '5kg', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600', true, 4.8, 50, 10.0, '2026-03-30 09:41:26.562628+00'),
	('03956856-32df-4815-a5af-26a89dfbde91', 'Tata Gold Tea Premium', 'Beverages', 4.99, '1kg', 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&q=80&w=600', true, 4.9, 100, 4.0, '2026-03-30 09:41:26.562628+00'),
	('7ad89687-7cbf-4f7a-972b-34a3c3a50409', 'Aashirvaad Whole Wheat Atta', 'Flour & Atta', 9.99, '10kg', 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&q=80&w=600', false, 4.7, 30, NULL, '2026-03-30 09:41:26.562628+00'),
	('1c8ad761-59e7-4cff-93af-a3f32c8e55ea', 'Haldiram''s Bhujia Sev', 'Snacks', 2.5, '400g', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600', true, 4.6, 200, 2.0, '2026-03-30 09:41:26.562628+00'),
	('c7e60163-7654-4977-91ad-5f41488fd4dd', 'MDH Deggi Mirch', 'Spices', 1.99, '100g', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600', true, 4.9, 150, NULL, '2026-03-30 09:41:26.562628+00'),
	('d1e8d434-13ec-4751-b163-a3da19ab0622', 'Amul Pure Ghee', 'Dairy & Pantry', 7.5, '1L', 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&q=80&w=600', false, 4.8, 40, 6.5, '2026-03-30 09:41:26.562628+00'),
	('6ebdb68e-3342-4d20-9f29-b28cc240511f', 'Parle-G Biscuits', 'Snacks', 0.99, '300g', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=600', false, 4.5, 500, 0.8, '2026-03-30 09:41:26.562628+00'),
	('2e612ab6-2416-4f79-99a1-33fd8ba1ab09', 'Dabur Red Toothpaste', 'Personal Care', 3.25, '200g', 'https://images.unsplash.com/photo-1559591937-e1dc329ac5a4?auto=format&fit=crop&q=80&w=600', false, 4.4, 80, NULL, '2026-03-30 09:41:26.562628+00');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('products', 'products', NULL, '2026-03-30 09:41:26.654594+00', '2026-03-30 09:41:26.654594+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('invoices', 'invoices', NULL, '2026-03-30 09:41:27.142105+00', '2026-03-30 09:41:27.142105+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict RlfVbXlGoeuqHhRLpv1oJ6UtQlwx3cIEAKGROaBJ3GhyUOBBy1gbONFpJZhNQyu

RESET ALL;
