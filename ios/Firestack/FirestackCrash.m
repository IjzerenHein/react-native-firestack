//
//  FirestackCrash.m
//  Firestack
//
//  Created by Hein Rutjes on 6/09/16.
//  Copyright © 2016 aTO Gear. All rights reserved.
//

@import Firebase;
#import "FirestackCrash.h"
#import <asl.h>
#import "RCTLog.h"


@import FirebaseCrash;

RCTLogFunction FIRReactLogFunction = ^(
                                       RCTLogLevel level,
                                       __unused RCTLogSource source,
                                       NSString *fileName,
                                       NSNumber *lineNumber,
                                       NSString *message
                                       )
{
    NSString *log = RCTFormatLog([NSDate date], level, fileName, lineNumber, message);
    
#ifdef DEBUG
    fprintf(stderr, "%s\n", log.UTF8String);
    fflush(stderr);
#else
    FIRCrashMessage(log);
#endif
    
    int aslLevel;
    switch(level) {
        case RCTLogLevelTrace:
            aslLevel = ASL_LEVEL_DEBUG;
            break;
        case RCTLogLevelInfo:
            aslLevel = ASL_LEVEL_NOTICE;
            break;
        case RCTLogLevelWarning:
            aslLevel = ASL_LEVEL_WARNING;
            break;
        case RCTLogLevelError:
            aslLevel = ASL_LEVEL_ERR;
            break;
        case RCTLogLevelFatal:
            aslLevel = ASL_LEVEL_CRIT;
            break;
    }
    asl_log(NULL, NULL, aslLevel, "%s", message.UTF8String);
};

@implementation FirestackCrash

- (id) init
{
    self = [super init];
    if (self) {
        //Add the following lines
        RCTSetLogFunction(FIRReactLogFunction);
        RCTSetLogThreshold(RCTLogLevelInfo);
    }
    return self;
}

RCT_EXPORT_MODULE(FirestackCrash);

RCT_EXPORT_METHOD(log:(NSString *)message)
{
    FIRCrashNSLog(message);
}

RCT_EXPORT_METHOD(logcat:(int)level message:(NSString *)message)
{
    FIRCrashNSLog(message);
}

RCT_EXPORT_METHOD(report:(NSString *)error)
{
    FIRCrashNSLog(error);
    assert(NO);
}

@end
