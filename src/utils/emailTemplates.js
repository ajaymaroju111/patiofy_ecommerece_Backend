exports.conformSignup = (username, securityKey) => {
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
        <a href="http://147.93.97.20:3000/patiofy/auth/user/verify?verificationKey=${securityKey}" class="verify-btn">Verify Account</a>
    </div>

    <div class="company-info">
        <h3>About Our Company</h3>
        <p><strong>Patiofy:</strong> Tech Solutions Inc.</p>
        <p><strong>Contact:</strong> support@Patiofy.com</p>
        <p><strong>Website:</strong> <a href="#" style="color: #007BFF; text-decoration: none;">www.Patiofy.com</a></p>
    </div>
</body>
</html>
  `;
};

exports.forgetPassword = (username) => {
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
      <a href="http://147.93.97.20:3000/patiofy/auth/user/password/setNew" class="reset-link">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
      <p>Thank you!<br>The Team</p>
    </div>
    <div class="footer">
      &copy; 2025 Patiofy. All rights reserved.
    </div>
  </div>
</body>
</html>

  `;
};

exports.forgetUsername = (fullname, username) => {
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

  `;
};

exports.getSuccessMark = () => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Success</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4fdf4;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .success-container {
      text-align: center;
      background: white;
      padding: 2.5em 2em;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(0, 128, 0, 0.1);
      max-width: 400px;
      width: 100%;
    }

    .success-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto 1.5em;
      animation: blink 1.5s infinite ease-in-out;
    }

    @keyframes blink {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }

    .success-message {
      font-size: 1.5em;
      color: #333;
      margin-bottom: 0.5em;
    }

    .success-subtext {
      color: #666;
      font-size: 1em;
      margin-bottom: 1.5em;
    }

    .redirect-button {
      background-color: #4CAF50;
      color: white;
      padding: 0.6em 1.5em;
      text-decoration: none;
      border: none;
      border-radius: 5px;
      font-size: 1em;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .redirect-button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <div class="success-container">
    <img src="/images/check.png" alt="Success Icon" class="success-icon" />
    <div class="success-message">Success!</div>
    <div class="success-subtext">Account verified successfully, please login.</div>
    <a href="http://192.168.1.39:5173/" class="redirect-button">Go to Homepage</a>
  </div>

</body>
</html>

  `;
};

exports.sessionExpired = () => {
 return `
 <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Session Expired</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }

    .container {
      background-color: white;
      padding: 40px 30px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }

    .icon {
      font-size: 60px;
      margin-bottom: 20px;
      color: #ff6b6b;
      animation: pulse 1.5s infinite;
    }

    h1 {
      font-size: 28px;
      margin-bottom: 15px;
      color: #222;
    }

    p {
      font-size: 16px;
      margin-bottom: 25px;
      color: #555;
    }

    .btn {
      display: inline-block;
      padding: 12px 25px;
      background-color: #007BFF;
      color: white;
      border-radius: 6px;
      text-decoration: none;
      transition: background 0.3s ease;
    }

    .btn:hover {
      background-color: #0056b3;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.15);
        opacity: 0.6;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 30px 20px;
      }

      h1 {
        font-size: 24px;
      }

      p {
        font-size: 14px;
      }

      .btn {
        font-size: 14px;
        padding: 10px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">&#x23F3;</div>
    <h1>Session Expired</h1>
    <p>Your session has timed out due to inactivity or exceeded time limit.</p>
    <a href="/" class="btn">Go to Homepage</a>
  </div>
</body>
</html>

 `
};

exports.userNotFound = () => {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>User Not Found</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f0f4f8;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      background-color: #ffffff;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
      text-align: center;
      transition: all 0.3s ease;
    }

    .icon {
      font-size: 70px;
      color: #e63946;
      margin-bottom: 1.5rem;
      animation: pulse 1.6s infinite ease-in-out;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 0.75rem;
      color: #1a1a1a;
    }

    p {
      font-size: 1rem;
      color: #555;
      margin-bottom: 2rem;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.8rem;
      background-color: #007bff;
      color: #fff;
      border-radius: 0.5rem;
      text-decoration: none;
      font-size: 1rem;
      transition: background-color 0.3s ease;
    }

    .btn:hover {
      background-color: #0056b3;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.7;
      }
    }

    /* Responsive Styling */
    @media (max-width: 768px) {
      .container {
        padding: 2rem;
      }

      .icon {
        font-size: 60px;
      }

      h1 {
        font-size: 1.75rem;
      }

      p {
        font-size: 0.95rem;
      }

      .btn {
        font-size: 0.95rem;
        padding: 0.7rem 1.6rem;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 1.5rem;
      }

      .icon {
        font-size: 50px;
      }

      h1 {
        font-size: 1.5rem;
      }

      p {
        font-size: 0.9rem;
      }

      .btn {
        font-size: 0.9rem;
        padding: 0.65rem 1.4rem;
      }
    }

    @media (max-width: 360px) {
      h1 {
        font-size: 1.3rem;
      }

      .btn {
        font-size: 0.85rem;
        padding: 0.6rem 1.2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>User Not Found</h1>
    <p>Sorry, the user you're trying to find doesn't exist or may have been removed.</p>
    <a href="/" class="btn">Return to Homepage</a>
  </div>
</body>
</html>

  `
}
