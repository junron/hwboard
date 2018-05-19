# Rendering homework

This documents the way homework is currently rendered on the front end. This is not a specification and you do not need to follow this strictly, or follow this at all.

## Sorting modes and order
Every mode should have two order options:  
  - Ascending (increasing) -> represented by 0
  - Descending (decreasing) -> represented by 1  

The default order is ascending.  
Ensure that errors are handled if the order is not an integer

Modes:  
1. By due date
2. By subject name

The default mode is `By due date` with order `0` 

All versions of hwboard should implement at least the above modes.

## Rendering

This section is only a recommendation and may be revised.

The array of homework objects should be sorted in ascending order. If descending order is specified, `array.reverse()` can be used to reverse the data.

Let html be an empty string  
`let html = ""`  

For each homework in the array, check if its subject has already been rendered.  

- If not, an unclosed `<li>` tag is appended to `html`.  
It is followed by a `<h3>` tag that contains the subject name.  
Finally, an unclosed `<ul>`is appended to `html`
   - If this subject is not the first subject, a closing `</ul>` and `</li>` should be appended to close this subject. An appropriate seperating element may be used to mark the end of the subject.   
  
A `<li>` tag is appended to `html`. It should contain an [icon](#icons) and the relevant data about the homework.

### Icons
All icons are from [Google's material design icon font](https://material.io/icons/).  

If the homework is graded or is a test, an [assessment icon](https://material.io/icons/#ic_assessment) (HTML entity: `&#xE85C;`) may be used.

If the homework is not graded, a [description icon](https://material.io/icons/#ic_description) (HTML entity: `&#xE873;`) may be used. 

### Color
#### Background color
<p style="background-color:#bbdefb;color:black">If the homework is graded or is a test, <code style="color:black">#bbdefb</code> may be used as the background color</p>
<p style="background-color:#ffffff;color:black">Otherwise, the background color remains white.</p>

#### Font color
<p style="color:#ff0000">If the homework is due <a href="#-definition-of-dates">today</a>, <code style="color:#ff0000">#ff0000</code> may be used as the font color</p>
<p style="color:#ab47bc">If the homework is due <a href="#-definition-of-dates">the following day</a>, <code style="color:#ab47bc">#ab47bc</code> may be used as the font color</p>
<p style="background-color:#ffffff;color:black">Otherwise, the text remains black</p>

### Definition of dates
The number of days is defined as the number of squares on a calendar until that date.  
For example

| Start        | End          | Days  | 
| ------------- | ------------- | ----- |
| 5/3/2018 6:40pm  | 6/3/2018 7:00am | 1 |
| 5/3/2018 6:40pm  | 5/3/2018 7:00pm | 0 |
| 5/3/2018 6:40pm  | 6/3/2018 12 midnight | 1 |
| 5/3/2018 23:59  | 6/3/2018 12 midnight | 1 |
