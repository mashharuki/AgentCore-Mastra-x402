#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AgentCoreMastraX402Stack } from "../lib/cdk-stack";

const app = new cdk.App();

// AgentCoreMastraX402Stackスタックをインスタンス化
new AgentCoreMastraX402Stack(app, "AgentCoreMastraX402Stack", {});
