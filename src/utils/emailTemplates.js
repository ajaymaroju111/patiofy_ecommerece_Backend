


exports.conformSignup = (username , securityKey) =>{
  return `
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f4f4f4;
            flex-direction: column;
            text-align: center;
        }

        .container {
            background: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
            margin-bottom: 20px;
        }

        h2 {
            color: #333;
            margin-bottom: 10px;
        }

        .username {
            font-size: 18px;
            font-weight: bold;
            color: #007BFF;
            margin-bottom: 10px;
        }

        p {
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .verify-btn {
            display: inline-block;
            padding: 12px 20px;
            background: #007BFF;
            color: #fff;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            text-decoration: none;
            transition: background 0.3s ease;
        }

        .verify-btn:hover {
            background: #0056b3;
        }

        .company-info {
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }

        .company-info h3 {
            color: #333;
            margin-bottom: 10px;
        }

        .company-info p {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }

        @media (max-width: 480px) {
            .container, .company-info {
                padding: 20px;
            }

            .verify-btn {
                font-size: 14px;
                padding: 10px 18px;
            }
        }
    </style>
</head>
<body>

    <div class="container">
        <h2>Verify Your Account</h2>
        <p class="username">Hello, <span id="user-name">${username}</span>!</p>
        <p>Click the button below to verify your email and activate your account.</p>
        <a href="https://localhost:3000/${securityKey}" class="verify-btn">Verify Account</a>
    </div>

    <div class="company-info">
        <h3>About Our Company</h3>
        <p><strong>Patiofy:</strong> Tech Solutions Inc.</p>
        <p><strong>Contact:</strong> support@Patiofy.com</p>
        <p><strong>Website:</strong> <a href="#" style="color: #007BFF; text-decoration: none;">www.Patiofy.com</a></p>
    </div>
</body>
</html>
  `
}

exports.forgetPassword = (username) =>{
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #007bff;
      color: white;
      text-align: center;
      padding: 20px;
      font-size: 24px;
    }
    .content {
      padding: 40px 20px;
      text-align: center;
    }
    .reset-link {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 20px;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Reset Your Password</div>
    <div class="content">
      <p>Hi <strong>${username}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to proceed with resetting your password.</p>
      <a href="https://localhost:3000/patiofy/resetPassword" class="reset-link">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
      <p>Thank you!<br>The Team</p>
    </div>
    <div class="footer">
      &copy; 2025 Patiofy. All rights reserved.
    </div>
  </div>
</body>
</html>

  `
}

exports.forgetUsername = (fullname, username) =>{
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Retrieve Your Username</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #007bff;
      color: white;
      text-align: center;
      padding: 20px;
      font-size: 24px;
    }
    .content {
      padding: 40px 20px;
      text-align: center;
    }
    .username-box {
      background-color: #f0f4f8;
      display: inline-block;
      font-size: 20px;
      font-weight: bold;
      color: #007bff;
      padding: 10px 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Your Username Recovery</div>
    <div class="content">
      <p>Hi <strong>${fullname}</strong>,</p>
      <p>We received a request to retrieve your username. Here it is:</p>
      <div class="username-box">${username}</div>
      <p>If you did not request this, please ignore this email or contact our support team.</p>
      <p>Thank you!<br>The Team</p>
    </div>
    <div class="footer">
      &copy; 2025 Patiofy. All rights reserved.
    </div>
  </div>
</body>
</html>

  `
}
