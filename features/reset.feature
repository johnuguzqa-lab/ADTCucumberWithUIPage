Feature: Reset
  As a user of the Vegetable Counter
  I want to start over
  So that I can clear a calculation and begin again

  Scenario: Reset returns the application to its initial state
    Given I am on the Vegetable Counter page
    And I have 5 cucumbers in stock
    And I eat 3 cucumbers
    When I calculate the remaining vegetables
    Then the application should show 2 cucumbers remaining
    When I reset the application
    Then every quantity field should be empty
    And the total remaining should be 0
