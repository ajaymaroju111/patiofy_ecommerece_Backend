




exports.conformSignup = (username , securityKey) =>{
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Account</title>
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
      font-weight: bold;
    }
    .content {
      padding: 40px 20px;
      text-align: center;
    }
    .security-key {
      background-color: #f0f4f8;
      display: inline-block;
      font-size: 18px;
      font-weight: bold;
      color: #007bff;
      padding: 10px 20px;
      border-radius: 8px;
      margin: 20px 0;
      word-break: break-word;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      padding: 20px;
    }
    /* Responsive Design */
    @media screen and (max-width: 600px) {
      .container {
        width: 90%;
        margin: 20px auto;
      }
      .content {
        padding: 30px 15px;
      }
      .security-key {
        font-size: 16px;
        padding: 8px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Verify Your Account</div>
    <div class="content">
      <p>Hi <strong>${username}</strong>,</p>
      <p>Thank you for signing up. Please use the security key below to verify your account:</p>
      <div class="security-key">${securityKey}</div>
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