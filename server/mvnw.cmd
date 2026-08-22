@echo off
setlocal EnableExtensions

set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

if not exist "%WRAPPER_JAR%" (
  echo Could not find maven-wrapper.jar at %WRAPPER_JAR%
  exit /b 1
)

set "JAVA_EXE="

if defined JAVA_HOME (
  set "JAVA_HOME=%JAVA_HOME:"=%"
  if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"
  if exist "%JAVA_HOME%\bin\java.exe" set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
)

if not defined JAVA_EXE (
  for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\JDK" /s /v Path 2^>nul ^| findstr /i "Path"') do (
    if exist "%%b\bin\java.exe" set "JAVA_EXE=%%b\bin\java.exe"
  )
)

if not defined JAVA_EXE (
  if exist "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe" (
    set "JAVA_EXE=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe"
  )
)

if not defined JAVA_EXE (
  where java.exe >nul 2>&1
  if not errorlevel 1 set "JAVA_EXE=java.exe"
)

if not defined JAVA_EXE (
  echo ERROR: 找不到 Java。请安装 JDK 17+ 并设置 JAVA_HOME，或重启终端后再试。
  echo 可执行: winget install Microsoft.OpenJDK.17
  exit /b 1
)

"%JAVA_EXE%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
exit /b %ERRORLEVEL%
