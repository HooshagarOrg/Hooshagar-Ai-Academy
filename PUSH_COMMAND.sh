#!/bin/bash
# ============================================
# دستور Push برای GitHub
# ============================================

# استفاده:
# 1. این فایل را باز کنید
# 2. TOKEN خود را جایگزین کنید
# 3. دستور را در terminal کپی و اجرا کنید

# ============================================
# روش 1: با Personal Access Token (پیشنهادی)
# ============================================

# Token خود را از اینجا بگیرید:
# https://github.com/settings/tokens
# Permissions: repo (full control)

YOUR_GITHUB_TOKEN="ghp_YOUR_TOKEN_HERE"
REPO_URL="github.com/pedpeddy60/HooshaGar-Academy-Curser-Test.git"

git push https://${YOUR_GITHUB_TOKEN}@${REPO_URL} master

# ============================================
# روش 2: بدون Token (نیاز به Login)
# ============================================

# git push origin master

# ============================================
# روش 3: SSH (اگر SSH key دارید)
# ============================================

# git push git@github.com:pedpeddy60/HooshaGar-Academy-Curser-Test.git master

# ============================================
# توضیحات:
# ============================================

# اگر error "fatal: The current branch master has no upstream branch":
# git push --set-upstream origin master

# اگر error "fatal: Authentication failed":
# Token خود را بروزرسانی کنید

# برای دیدن لیست commits:
# git log --oneline -5

# برای دیدن تغییرات:
# git status

