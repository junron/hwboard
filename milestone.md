1. Channels
    - Channels should have different permission levels to limit access
    - Root users should be able to modify channel settings, including subjects, channel name, and members.
    -  Channels should be easily creatable somehow
    - Channels should be able to "import" and include other channels, only if the importer has root permissions in the importing channel and at least admin permissions in the exporting channel
2. UI
    - Consider swipe actions instead of tap-and-hold for editing and deleting homework on touch screens
    - Show context menu on right click on desktop
    - Search and dropdown suggestions for adding members to a channel
    - Add search features for homework??
    - Improve colors somehow??
3. New Features
    - Mark as done
        - Hides homework unless a `show all` setting is enabled
        - Could be activated by swipe?
        - Allows for users to be notified about homework not done
        - Users can see how many % of members have completed homework
    - Analytics
        - Graph of homework v time
        - Graph of homework v subject 
        - See who is the biggest contributer in terms of adding homework
4. Security
    - Increase number of unit tests
        - Send incorrect types and see what happens
    - Increase mitigation for CSRF
        - Especially for websockets, maybe implement CSRF token on top of origin checking
