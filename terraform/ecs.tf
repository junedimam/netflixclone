# ═══════════════════════════════════════════════
# ECS FARGATE CLUSTER & SERVICES
# ═══════════════════════════════════════════════

# ── ECS Cluster ────────────────────────────────
resource "aws_ecs_cluster" "main" {
  count = var.create_vpc ? 1 : 0
  name  = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.project_name}-ecs-cluster" }
}

# ── ECS Task Execution IAM Role ────────────────
resource "aws_iam_role" "ecs_task_execution" {
  count = var.create_vpc ? 1 : 0
  name  = "${var.project_name}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = { Name = "${var.project_name}-ecs-task-execution" }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  count      = var.create_vpc ? 1 : 0
  role       = aws_iam_role.ecs_task_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow ECS tasks to pull from ECR
resource "aws_iam_role_policy" "ecs_task_execution_ecr" {
  count = var.create_vpc ? 1 : 0
  name  = "${var.project_name}-ecs-ecr-pull"
  role  = aws_iam_role.ecs_task_execution[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# ── ECS Task Role (for app to access S3) ───────
resource "aws_iam_role" "ecs_task" {
  count = var.create_vpc ? 1 : 0
  name  = "${var.project_name}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = { Name = "${var.project_name}-ecs-task" }
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  count = var.create_vpc ? 1 : 0
  name  = "${var.project_name}-ecs-task-s3"
  role  = aws_iam_role.ecs_task[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.media_bucket_name}",
          "arn:aws:s3:::${var.media_bucket_name}/*"
        ]
      }
    ]
  })
}

# ── Security Groups ────────────────────────────
# ALB Security Group
resource "aws_security_group" "alb" {
  count       = var.create_vpc ? 1 : 0
  name        = "${var.project_name}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  count       = var.create_vpc ? 1 : 0
  name        = "${var.project_name}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb[0].id]
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb[0].id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-ecs-tasks-sg" }
}

# ── Application Load Balancer ──────────────────
resource "aws_lb" "main" {
  count              = var.create_vpc ? 1 : 0
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.public[*].id

  tags = { Name = "${var.project_name}-alb" }
}

resource "aws_lb_target_group" "backend" {
  count       = var.create_vpc ? 1 : 0
  name        = "${var.project_name}-backend-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main[0].id
  target_type = "ip"

  health_check {
    path                = "/api/movies"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = { Name = "${var.project_name}-backend-tg" }
}

resource "aws_lb_target_group" "frontend" {
  count       = var.create_vpc ? 1 : 0
  name        = "${var.project_name}-frontend-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main[0].id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = { Name = "${var.project_name}-frontend-tg" }
}

resource "aws_lb_listener" "main" {
  count             = var.create_vpc ? 1 : 0
  load_balancer_arn = aws_lb.main[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend[0].arn
  }
}

# Route /api/* to backend, everything else to frontend
resource "aws_lb_listener_rule" "api" {
  count        = var.create_vpc ? 1 : 0
  listener_arn = aws_lb_listener.main[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ── ECS Task Definitions ───────────────────────
resource "aws_ecs_task_definition" "backend" {
  count                    = var.create_vpc ? 1 : 0
  family                   = "${var.project_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution[0].arn
  task_role_arn            = aws_iam_role.ecs_task[0].arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend[0].repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 5000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "PORT"
          value = "5000"
        },
        {
          name  = "MONGO_URI"
          value = var.mongo_uri
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "AWS_S3_BUCKET"
          value = var.media_bucket_name
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}-backend"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])

  tags = { Name = "${var.project_name}-backend-task" }
}

resource "aws_ecs_task_definition" "frontend" {
  count                    = var.create_vpc ? 1 : 0
  family                   = "${var.project_name}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution[0].arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend[0].repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}-frontend"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])

  tags = { Name = "${var.project_name}-frontend-task" }
}

# ── ECS Services ───────────────────────────────
resource "aws_ecs_service" "backend" {
  count           = var.create_vpc ? 1 : 0
  name            = "${var.project_name}-backend-service"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.backend[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks[0].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend[0].arn
    container_name   = "backend"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener_rule.api]

  tags = { Name = "${var.project_name}-backend-service" }
}

resource "aws_ecs_service" "frontend" {
  count           = var.create_vpc ? 1 : 0
  name            = "${var.project_name}-frontend-service"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.frontend[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks[0].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend[0].arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.main]

  tags = { Name = "${var.project_name}-frontend-service" }
}

# ── CloudWatch Log Groups ──────────────────────
resource "aws_cloudwatch_log_group" "backend" {
  count             = var.create_vpc ? 1 : 0
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 7

  tags = { Name = "${var.project_name}-backend-logs" }
}

resource "aws_cloudwatch_log_group" "frontend" {
  count             = var.create_vpc ? 1 : 0
  name              = "/ecs/${var.project_name}-frontend"
  retention_in_days = 7

  tags = { Name = "${var.project_name}-frontend-logs" }
}