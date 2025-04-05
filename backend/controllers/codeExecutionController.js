import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import FileModel from "../models/fileModel.js";

export const executeCode = async (req, res) => {
  const userId = req.userId;
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required." });
  }

  const tempDir = "/app/temp";
  await fs.mkdir(tempDir, { recursive: true });

  const timestamp = Date.now();
  let fileName,
    command,
    args = [],
    className,
    binaryName;

  try {
    switch (language) {
      case "javascript":
        command = "node";
        args = ["-e", code];
        break;

      case "typescript":
        fileName = `main_${timestamp}.ts`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        command = "ts-node";
        args = [fileName];
        break;

      case "python":
        command = "python3";
        args = ["-c", code];
        break;

      case "csharp":
        fileName = `Main_${timestamp}.cs`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        command = "dotnet";
        args = ["run", "--project", tempDir];
        break;

      case "java":
        className = "Main";
        fileName = `${className}.java`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        command = "javac";
        args = [fileName];
        break;

      case "ruby":
        command = "ruby";
        args = ["-e", code];
        break;

      case "swift":
        fileName = `main_${timestamp}.swift`;
        binaryName = `main_${timestamp}`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        await compileAndWait("swiftc", [fileName, "-o", binaryName], tempDir);
        command = `./${binaryName}`;
        args = [];
        break;

      case "go":
        fileName = `main_${timestamp}.go`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        command = "go";
        args = ["run", fileName];
        break;

      case "rust":
        fileName = `main_${timestamp}.rs`;
        binaryName = `main_${timestamp}`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        await compileAndWait("rustc", [fileName, "-o", binaryName], tempDir);
        command = `./${binaryName}`;
        args = [];
        break;

      case "cpp":
      case "c++":
        fileName = `main_${timestamp}.cpp`;
        binaryName = `main_${timestamp}`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        await compileAndWait("g++", [fileName, "-o", binaryName], tempDir);
        command = `./${binaryName}`;
        args = [];
        break;

      case "c":
        fileName = `main_${timestamp}.c`;
        await fs.writeFile(path.join(tempDir, fileName), code);
        await new Promise((resolve, reject) => {
          const compile = spawn("gcc", [fileName, "-o", "main"], {
            cwd: tempDir,
          });
          compile.stderr.on("data", (data) =>
            console.error("C compile error:", data.toString())
          );
          compile.on("close", (code) => {
            if (code !== 0) reject(new Error("C compilation failed"));
            else resolve();
          });
        });
        // 👇 Update this line
        command = path.join(tempDir, "main");
        args = [];
        break;

      default:
        return res.status(400).json({ error: "Language not supported." });
    }

    let process;

    if (language === "java") {
      // Compile first
      const compileErr = await spawnAndGetStderr(command, args, tempDir);
      if (compileErr) return res.status(400).json({ error: compileErr });

      process = spawn("java", [className], { cwd: tempDir, timeout: 10000 });
    } else if (
      ["csharp", "go", "swift", "rust", "cpp", "c++", "c"].includes(language)
    ) {
      process = spawn(command, args, { cwd: tempDir, timeout: 20000 });
    } else if (["typescript"].includes(language)) {
      process = spawn(command, args, { cwd: tempDir, timeout: 10000 });
    } else {
      process = spawn(command, args, { timeout: 10000 });
    }

    let output = "";
    let errorOutput = "";

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    const exitCode = await new Promise((resolve) => {
      process.on("close", resolve);
    });

    if (exitCode === 0) {
      res.json({ output: output.trim() });
    } else {
      res
        .status(500)
        .json({ error: errorOutput.trim() || "Execution failed." });
    }
  } catch (error) {
    console.error("Error executing code:", error);
    res.status(500).json({ error: "Execution failed." });
  } finally {
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file));
      }
      await fs.rmdir(tempDir);
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError);
    }
  }
};

// Helper: compile and wait
const compileAndWait = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    const compile = spawn(command, args, { cwd });
    compile.stderr.on("data", (data) =>
      console.error(`${command} error:`, data.toString())
    );
    compile.on("close", (code) => {
      if (code !== 0) reject(new Error(`${command} compilation failed`));
      else resolve();
    });
  });
};

// Helper: spawn with error return
const spawnAndGetStderr = (command, args, cwd) => {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd });
    let errorText = "";
    proc.stderr.on("data", (data) => {
      errorText += data.toString();
    });
    proc.on("close", (code) => {
      resolve(code !== 0 ? errorText.trim() : null);
    });
  });
};

/* export const getUserSnippets = async (req, res) => {
    const userId = req.userId;

    if (userId !== req.params.userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const snippets = await FileModel.find({ userId: userId });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; */

export const createFile = async (req, res) => {
  const { userId, codeId, code, input = "", fileName, language } = req.body;

  if (!userId || !codeId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing userId or codeId" });
  }

  try {
    // Check if file already exists for the user
    const existingFile = await FileModel.findOne({ userId, codeId });
    if (existingFile) {
      return res
        .status(400)
        .json({ success: false, message: "File already exists" });
    }

    // Create new file
    const newFile = new FileModel({
      userId,
      codeId,
      code,
      input,
      fileName,
      language,
    });
    await newFile.save();

    res.status(201).json({
      success: true,
      message: "File created successfully",
      file: newFile,
    });
  } catch (error) {
    console.error("Error creating file:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const saveCode = async (req, res) => {
  const { userId, codeId, code, fileName, language } = req.body;
  const { id } = req.params; // Extract the id string from req.params

  console.log(userId);

  try {
    if (!userId || !codeId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const updatedCode = await FileModel.findOneAndUpdate(
      { _id: id, userId: userId }, // use the id and the userId in the query.
      { code, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedCode) {
      return res
        .status(404)
        .json({ message: "File not found or user not authorized" });
    }

    console.log(updatedCode);

    res.json({ success: true, file: updatedCode });
  } catch (error) {
    console.error("Error saving code:", error);
    res.status(500).json({ success: false });
  }
};

// Get Code
export const getUserCode = async (req, res) => {
  try {
    const userCode = await FileModel.find({ userId: req.params.userId }).sort({
      updatedAt: -1,
    });
    res.json({ success: true, code: userCode || {} });
  } catch (error) {
    console.error("Error fetching code:", error);
    res.status(500).json({ success: false });
  }
};

export const getCodeById = async (req, res) => {
  try {
    const userCode = await FileModel.findById(req.params.id);
    res.json({ success: true, code: userCode || {} });
  } catch (error) {
    console.error("Error fetching code:", error);
    res.status(500).json({ success: false });
  }
};
