@smoke
Feature: Cucumbers
  As a user of the Vegetable Counter
  I want to see how many cucumbers I have left
  So that I know what remains after eating some

  Scenario: Show how many cucumbers remain after eating some
    Given I am on the Vegetable Counter page
    And I have 5 cucumbers in stock
    And I eat 3 cucumbers
    When I calculate the remaining vegetables
    Then the application should show 2 cucumbers remaining
