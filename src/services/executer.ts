import {spawn} from "child_process";
import {commandConfig} from "../constants/interfaces";
import {workspace} from "vscode";
import {Command} from "../commands/command-base";
import {allowedOptions} from "../constants/extensionConfig/user-config";

const defaultConfig = {
    execOptions: {
        cwd: workspace.rootPath
    },
    logProcess: false
};

export function gitExecutor(args: string | string[], cmdConfig?: commandConfig) {
    return new Promise((resolve, reject) => {

        if (!args || !args.length) {
            reject("No arguments were given");
        }

        if (!Array.isArray(args)) {
            args = args.split(' ');
        }

        cmdConfig = {...defaultConfig, ...cmdConfig};

        if (cmdConfig.logProcess) {
            const message = cmdConfig.customMsg ? `${cmdConfig.customMsg}...` : `git ${args[0]} is executing...`;
            console.log('\x1b[36m%s\x1b[0m', message);
        }

        const commandExecuter = spawn('git', args, cmdConfig.execOptions);
        let stdOutData = '';
        let stderrData = '';

        commandExecuter.stdout.on('data', (data) => stdOutData += data);
        commandExecuter.stderr.on('data', (data) => stderrData += data);
        commandExecuter.on('close', (code) => code != 0
            ? reject(removeEmptyLine(stderrData.toString()))
            : resolve(removeEmptyLine(stdOutData.toString()))
        );
    });
}

export function buildMergeCmd(options: string[] = [], branchName = '', commitMessage?: string): string {
    if (!options.length && !branchName) {
        Command.logger.logError('No options were passed to mergeCmd gen!');
        return '';
    }

    if (options.some((opt) => typeof opt !== 'string')) {
        Command.logger.logError('Options are accepted only as a string array!');
        return '';
    }

    let command = branchName ? `merge ${branchName}` : 'merge';
    options.forEach((option) => {
        const allowedOption = allowedOptions.merge[option];
        if (allowedOption && option !== 'm') {
            command += ` ${allowedOption}${option}`;
        }
    });

    return commitMessage ? `${command} -m '${commitMessage}'` : command;
}

export function buildStashCmd(cmd: string, stashName = ''): string[] {
    if (!cmd) {
        Command.logger.logError('No stash command given!');
        return [];
    }

    const fullCmd = ['stash', ...cmd.split(' ')];
    if (cmd === 'list') {
        fullCmd.push(`--pretty=format:{"detail":"%gd \u2022 %h \u2022 %cr","label":"%s","index":"%gd"},`);
    }
    if (stashName) {
        fullCmd.push(stashName);
    }

    return fullCmd;
}

function removeEmptyLine(str): string {
  return str.replace(/\n$/, '');
}