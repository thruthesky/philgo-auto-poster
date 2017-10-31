; This script was created using Pulover's Macro Creator
; www.macrocreator.com

#NoEnv
SetWorkingDir %A_ScriptDir%
CoordMode, Mouse, Window
SendMode Input
#SingleInstance Force
SetTitleMatchMode 2
#WinActivateForce
SetControlDelay 1
SetWinDelay 0
SetKeyDelay -1
SetMouseDelay -1
SetBatchLines -1


F6::
Macro1:
While true
{
    MsgBox, 0, , Kakao Macro will run in 3 secs! Dont do anything., 3
    Run, http://www.philgo.com/?module=post&action=get_auto_poster_idx_submit&post_id=auto_posting&posting_id=kakao&format=form
    WinWaitActive, Auto Posting - Google Chrome
    Sleep, 333
    Sleep, 1000
    Click, 133, 311 Left, 1
    Sleep, 10
    Send, {LControl Down}{a}{LControl Up}{LControl Down}{c}{LControl Up}
    Sleep, 1000
    Click, 1680, 233 Left, 1
    Send, {LControl Down}{v}{LControl Up}
    Sleep, 1000
    Send, {Enter}
    Sleep, 3000
    WinClose, Auto Posting - Google Chrome
    Sleep, 333
    Sleep, 5000
}
Return

