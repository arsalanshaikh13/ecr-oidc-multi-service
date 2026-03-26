#!/bin/bash

# Step 4.5: Clean up Task Definitions
echo ""
echo "🧹 Step 4.5: Deregistering and Deleting Task Definitions..."

# Define your task definition families exactly as they appear in AWS
# TASK_FAMILIES=("lirw-task-authors" "lirw-task-books" "lirw-task-dashboard")
TASK_FAMILIES=("webapp-task-dev" )
REGION="us-east-1"

for FAMILY in "${TASK_FAMILIES[@]}"; do
  echo "   🔍 Processing Task Definition Family: $FAMILY..."

  # 1. Find all ACTIVE revisions
  ACTIVE_REVISIONS=$(aws ecs list-task-definitions \
    --family-prefix "$FAMILY" \
    --status ACTIVE \
    --region "$REGION" \
    --query 'taskDefinitionArns' \
    --output text 2>/dev/null)

  # 2. Deregister ACTIVE revisions
  for ARN in $ACTIVE_REVISIONS; do
    if [ -n "$ARN" ] && [ "$ARN" != "None" ]; then
      # basename extracts just the 'family:revision' part from the long ARN for cleaner logs
      echo "      ⏳ Deregistering active revision: $(basename $ARN)..."
      aws ecs deregister-task-definition \
        --task-definition "$ARN" \
        --region "$REGION" > /dev/null 2>&1
    fi
  done

  # 3. Find all INACTIVE revisions (This now includes the ones we just deregistered above)
  INACTIVE_REVISIONS=$(aws ecs list-task-definitions \
    --family-prefix "$FAMILY" \
    --status INACTIVE \
    --region "$REGION" \
    --query 'taskDefinitionArns' \
    --output text 2>/dev/null)

  # 4. Permanently Delete INACTIVE revisions
  for ARN in $INACTIVE_REVISIONS; do
    if [ -n "$ARN" ] && [ "$ARN" != "None" ]; then
      echo "      🗑️  Permanently deleting revision: $(basename $ARN)..."
      aws ecs delete-task-definitions \
        --task-definitions "$ARN" \
        --region "$REGION" > /dev/null 2>&1
    fi
  done
  
  echo "      ✅ Task Definition Family $FAMILY completely cleared."
done